import { SchemaType, SchemaNode, ValidationError, ParsedSchema } from './types.js';
import { isPlainObject, cloneDeep, intersection } from './utils.js';

/**
 * Valid JSON Schema type literals
 */
const VALID_SCHEMA_TYPES: Set<string> = new Set([
  'string',
  'number',
  'integer',
  'boolean',
  'object',
  'array',
  'null'
]);

/**
 * Context for parsing operations
 */
interface ParseContext {
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validate that a type value is a valid SchemaType
 * Returns true if valid, adds error and returns false if invalid
 */
function validateType(
  type: unknown,
  path: string,
  context: ParseContext
): type is SchemaType | SchemaType[] {
  if (typeof type === 'string') {
    if (!VALID_SCHEMA_TYPES.has(type)) {
      context.errors.push({
        path,
        message: `Invalid type "${type}" at ${path}. Valid types are: string, number, integer, boolean, object, array, null`
      });
      return false;
    }
    return true;
  }

  if (Array.isArray(type)) {
    let allValid = true;
    for (let i = 0; i < type.length; i++) {
      if (typeof type[i] !== 'string' || !VALID_SCHEMA_TYPES.has(type[i])) {
        context.errors.push({
          path: `${path}[${i}]`,
          message: `Invalid type "${type[i]}" at ${path}[${i}]. Valid types are: string, number, integer, boolean, object, array, null`
        });
        allValid = false;
      }
    }
    return allValid;
  }

  // type is present but not string or array
  context.errors.push({
    path,
    message: `Invalid type value at ${path}. Expected string or array of strings.`
  });
  return false;
}

/**
 * Validate that all required properties exist in properties
 */
function validateRequired(
  required: unknown,
  properties: Record<string, SchemaNode> | undefined,
  path: string,
  context: ParseContext
): required is string[] {
  if (!Array.isArray(required)) {
    context.errors.push({
      path,
      message: `Invalid "required" at ${path}. Expected array of strings.`
    });
    return false;
  }

  let allValid = true;
  for (let i = 0; i < required.length; i++) {
    if (typeof required[i] !== 'string') {
      context.errors.push({
        path: `${path}[${i}]`,
        message: `Invalid required property at ${path}[${i}]. Expected string.`
      });
      allValid = false;
    } else if (properties && !(required[i] in properties)) {
      context.errors.push({
        path,
        message: `Required property "${required[i]}" at ${path} does not exist in properties.`
      });
      allValid = false;
    }
  }
  return allValid;
}

/**
 * Validate additionalProperties is boolean or schema
 */
function validateAdditionalProperties(
  additionalProperties: unknown,
  path: string,
  context: ParseContext
): boolean {
  if (typeof additionalProperties === 'boolean') {
    return true;
  }

  if (isPlainObject(additionalProperties)) {
    // It's a schema object, will be validated recursively
    return true;
  }

  context.errors.push({
    path,
    message: `Invalid "additionalProperties" at ${path}. Expected boolean or schema object.`
  });
  return false;
}

/**
 * Parse a raw JSON value into a SchemaNode
 * Traverses recursively, validates, and collects errors/warnings
 */
function parseNode(
  raw: unknown,
  path: string,
  context: ParseContext
): SchemaNode | null {
  if (!isPlainObject(raw)) {
    context.errors.push({
      path,
      message: `Invalid schema at ${path}. Expected object.`
    });
    return null;
  }

  const node: SchemaNode = { _path: path };

  // Parse type
  if ('type' in raw) {
    const typeValid = validateType(raw.type, path, context);
    if (typeValid) {
      node.type = raw.type as SchemaType | SchemaType[];
    }
  }

  // Parse properties (recursively)
  if ('properties' in raw && isPlainObject(raw.properties)) {
    node.properties = {};
    for (const key of Object.keys(raw.properties)) {
      const propPath = `${path}.properties.${key}`;
      const propNode = parseNode(raw.properties[key], propPath, context);
      if (propNode) {
        node.properties[key] = propNode;
      }
    }
  }

  // Parse and validate required
  if ('required' in raw) {
    const requiredValid = validateRequired(raw.required, node.properties, path, context);
    if (requiredValid) {
      node.required = raw.required as string[];
    }
  }

  // Parse and validate additionalProperties
  if ('additionalProperties' in raw) {
    const apValid = validateAdditionalProperties(raw.additionalProperties, path, context);
    if (apValid) {
      if (typeof raw.additionalProperties === 'boolean') {
        node.additionalProperties = raw.additionalProperties;
      } else {
        const apNode = parseNode(raw.additionalProperties, `${path}.additionalProperties`, context);
        if (apNode) {
          node.additionalProperties = apNode;
        }
      }
    }
  }

  // Parse items (recursively)
  if ('items' in raw) {
    const itemsNode = parseNode(raw.items, `${path}.items`, context);
    if (itemsNode) {
      node.items = itemsNode;
    }
  }

  // Parse composition keywords (allOf, anyOf, oneOf)
  for (const keyword of ['allOf', 'anyOf', 'oneOf'] as const) {
    if (keyword in raw) {
      const arr = raw[keyword];
      if (!Array.isArray(arr)) {
        context.errors.push({
          path,
          message: `Invalid "${keyword}" at ${path}. Expected array of schemas.`
        });
      } else {
        node[keyword] = [];
        for (let i = 0; i < arr.length; i++) {
          const subNode = parseNode(arr[i], `${path}.${keyword}[${i}]`, context);
          if (subNode) {
            node[keyword]!.push(subNode);
          }
        }
      }
    }
  }

  // Parse not
  if ('not' in raw) {
    const notNode = parseNode(raw.not, `${path}.not`, context);
    if (notNode) {
      node.not = notNode;
    }
  }

  return node;
}

/**
 * Merge multiple types into their intersection
 * Returns the most restrictive type set
 */
function mergeTypes(types: (SchemaType | SchemaType[] | undefined)[]): SchemaType | SchemaType[] | undefined {
  const typeSets: SchemaType[][] = [];

  for (const t of types) {
    if (t === undefined) continue;
    const arr = Array.isArray(t) ? t : [t];
    if (arr.length > 0) {
      typeSets.push(arr);
    }
  }

  if (typeSets.length === 0) return undefined;
  if (typeSets.length === 1) return typeSets[0].length === 1 ? typeSets[0][0] : typeSets[0];

  // Compute intersection of all type sets
  let result = typeSets[0];
  for (let i = 1; i < typeSets.length; i++) {
    result = intersection(result, typeSets[i]);
  }

  if (result.length === 0) return undefined; // No valid types (contradiction)
  return result.length === 1 ? result[0] : result;
}

/**
 * Merge two schema nodes (for allOf merging)
 * Returns a new merged SchemaNode
 */
function mergeSchemas(a: SchemaNode, b: SchemaNode, path: string): SchemaNode {
  const merged: SchemaNode = { _path: path };

  // Merge types (intersection)
  const mergedType = mergeTypes([a.type, b.type]);
  if (mergedType) {
    merged.type = mergedType;
  }

  // Merge properties (union, recursively)
  const allKeys = new Set([
    ...Object.keys(a.properties || {}),
    ...Object.keys(b.properties || {})
  ]);

  if (allKeys.size > 0) {
    merged.properties = {};
    for (const key of allKeys) {
      const aProp = a.properties?.[key];
      const bProp = b.properties?.[key];

      if (aProp && bProp) {
        // Both have the property, merge them
        merged.properties[key] = mergeSchemas(aProp, bProp, `${path}.properties.${key}`);
      } else {
        // Only one has the property, take it
        const prop = (aProp || bProp) as SchemaNode;
        merged.properties[key] = cloneDeep(prop);
        merged.properties[key]._path = `${path}.properties.${key}`;
      }
    }
  }

  // Merge required (union)
  const requiredA = a.required || [];
  const requiredB = b.required || [];
  const mergedRequired = [...new Set([...requiredA, ...requiredB])];
  if (mergedRequired.length > 0) {
    merged.required = mergedRequired;
  }

  // Merge additionalProperties
  // If any is false, result is false
  if (a.additionalProperties === false || b.additionalProperties === false) {
    merged.additionalProperties = false;
  } else if (typeof a.additionalProperties === 'boolean' && typeof b.additionalProperties === 'boolean') {
    // Both are true (since false case handled above)
    merged.additionalProperties = true;
  } else if (a.additionalProperties && b.additionalProperties) {
    // Both are schemas, merge them
    if (typeof a.additionalProperties !== 'boolean' && typeof b.additionalProperties !== 'boolean') {
      merged.additionalProperties = mergeSchemas(
        a.additionalProperties,
        b.additionalProperties,
        `${path}.additionalProperties`
      );
    } else {
      // One is schema, one is true - keep the schema
      merged.additionalProperties = cloneDeep(
        typeof a.additionalProperties !== 'boolean' ? a.additionalProperties : b.additionalProperties
      );
    }
  } else {
    // One has it, one doesn't - keep it
    merged.additionalProperties = cloneDeep(a.additionalProperties ?? b.additionalProperties);
  }

  // Merge items (for array types)
  if (a.items && b.items) {
    merged.items = mergeSchemas(a.items, b.items, `${path}.items`);
  } else if (a.items || b.items) {
    merged.items = cloneDeep(a.items || b.items);
    if (merged.items) {
      merged.items._path = `${path}.items`;
    }
  }

  return merged;
}

/**
 * Flatten a schema node by merging allOf
 * Returns a new flattened SchemaNode
 */
function flattenNode(node: SchemaNode): SchemaNode {
  // Start with a copy of the node
  const flattened: SchemaNode = cloneDeep(node);

  // Merge allOf schemas into the node
  if (flattened.allOf && flattened.allOf.length > 0) {
    for (const subSchema of flattened.allOf) {
      const flattenedSub = flattenNode(subSchema);
      const merged = mergeSchemas(flattened, flattenedSub, flattened._path || '');
      // Copy merged properties back to flattened
      Object.assign(flattened, merged);
    }
    // Remove allOf after merging
    delete flattened.allOf;
  }

  // Recursively flatten nested properties
  if (flattened.properties) {
    for (const key of Object.keys(flattened.properties)) {
      flattened.properties[key] = flattenNode(flattened.properties[key]);
    }
  }

  // Flatten items
  if (flattened.items) {
    flattened.items = flattenNode(flattened.items);
  }

  // Flatten additionalProperties if it's a schema
  if (flattened.additionalProperties && typeof flattened.additionalProperties !== 'boolean') {
    flattened.additionalProperties = flattenNode(flattened.additionalProperties);
  }

  // Flatten not
  if (flattened.not) {
    flattened.not = flattenNode(flattened.not);
  }

  // Handle anyOf/oneOf: compute flattened alternatives
  if (flattened.anyOf && flattened.anyOf.length > 0) {
    flattened._alternatives = flattened.anyOf.map(s => flattenNode(s));
  }

  if (flattened.oneOf && flattened.oneOf.length > 0) {
    // If we already have alternatives from anyOf, append
    const oneOfAlternatives = flattened.oneOf.map(s => flattenNode(s));
    if (flattened._alternatives) {
      flattened._alternatives = [...flattened._alternatives, ...oneOfAlternatives];
    } else {
      flattened._alternatives = oneOfAlternatives;
    }
  }

  return flattened;
}

/**
 * Check for consistency issues (warnings only)
 * - Contradictory types in same scope via allOf
 */
function checkConsistency(node: SchemaNode, context: ParseContext): void {
  // Check for contradictory types in allOf
  if (node.allOf && node.allOf.length > 0) {
    const types: Set<string> = new Set();

    // Collect types from parent and allOf schemas
    if (node.type) {
      const parentTypes = Array.isArray(node.type) ? node.type : [node.type];
      parentTypes.forEach(t => types.add(t));
    }

    for (const subSchema of node.allOf) {
      if (subSchema.type) {
        const subTypes = Array.isArray(subSchema.type) ? subSchema.type : [subSchema.type];
        subTypes.forEach(t => types.add(t));
      }
    }

    // Check if allOf schemas have contradictory types
    // A contradiction occurs when allOf includes type: "string" and type: "number" etc
    if (node.allOf.length >= 2) {
      const typeSetPerSchema: Set<string>[] = [];

      if (node.type) {
        const parentTypes = Array.isArray(node.type) ? node.type : [node.type];
        typeSetPerSchema.push(new Set(parentTypes));
      }

      for (const subSchema of node.allOf) {
        if (subSchema.type) {
          const subTypes = Array.isArray(subSchema.type) ? subSchema.type : [subSchema.type];
          typeSetPerSchema.push(new Set(subTypes));
        }
      }

      // Find intersection of all type sets
      if (typeSetPerSchema.length > 1) {
        let intersection = [...typeSetPerSchema[0]];
        for (let i = 1; i < typeSetPerSchema.length; i++) {
          intersection = intersection.filter(t => typeSetPerSchema[i].has(t));
        }

        if (intersection.length === 0) {
          context.warnings.push({
            path: node._path || '',
            message: `Contradictory types at ${node._path}. allOf schemas have no overlapping types.`
          });
        }
      }
    }
  }

  // Recursively check nested schemas
  if (node.properties) {
    for (const prop of Object.values(node.properties)) {
      checkConsistency(prop, context);
    }
  }

  if (node.items) {
    checkConsistency(node.items, context);
  }

  if (node.additionalProperties && typeof node.additionalProperties !== 'boolean') {
    checkConsistency(node.additionalProperties, context);
  }

  if (node.allOf) {
    for (const sub of node.allOf) {
      checkConsistency(sub, context);
    }
  }

  if (node.anyOf) {
    for (const sub of node.anyOf) {
      checkConsistency(sub, context);
    }
  }

  if (node.oneOf) {
    for (const sub of node.oneOf) {
      checkConsistency(sub, context);
    }
  }

  if (node.not) {
    checkConsistency(node.not, context);
  }
}

/**
 * Parse a JSON Schema from raw JSON data
 * Returns ParsedSchema with original structure, flattened view, and errors/warnings
 */
export function parseSchema(raw: unknown): ParsedSchema {
  const context: ParseContext = {
    errors: [],
    warnings: []
  };

  const original = parseNode(raw, '', context);

  if (!original) {
    return {
      original: { _path: '' },
      flattened: { _path: '' },
      errors: context.errors,
      warnings: context.warnings
    };
  }

  // Check consistency (warnings only)
  checkConsistency(original, context);

  // Compute flattened view (merge allOf)
  const flattened = flattenNode(original);

  return {
    original,
    flattened,
    errors: context.errors,
    warnings: context.warnings
  };
}

/**
 * Check if parsing produced any errors
 */
export function hasErrors(parsed: ParsedSchema): boolean {
  return parsed.errors.length > 0;
}

/**
 * Print errors to stderr
 */
export function printErrors(parsed: ParsedSchema): void {
  for (const error of parsed.errors) {
    console.error(error.message);
  }
}

/**
 * Print warnings to stderr
 */
export function printWarnings(parsed: ParsedSchema): void {
  for (const warning of parsed.warnings) {
    console.error(`Warning: ${warning.message}`);
  }
}
