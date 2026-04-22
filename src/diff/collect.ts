import type { SchemaNode } from '../types.js';
import type { Change, ChangeKind } from './types.js';
import { createChange } from './types.js';
import { setDifference, normalizeTypes } from '../utils.js';

/**
 * Recursively compare two schema nodes and collect all changes
 * @param oldNode - The old schema node
 * @param newNode - The new schema node
 * @param path - Current JSON path (e.g., "properties.email")
 * @returns Array of Change objects
 */
export function collectChanges(
  oldNode: SchemaNode,
  newNode: SchemaNode,
  path: string = ''
): Change[] {
  const changes: Change[] = [];

  // Compare type
  const typeChanges = compareType(oldNode, newNode, path);
  changes.push(...typeChanges);

  // Compare properties
  const propertyChanges = compareProperties(oldNode, newNode, path);
  changes.push(...propertyChanges);

  // Compare required
  const requiredChanges = compareRequired(oldNode, newNode, path);
  changes.push(...requiredChanges);

  // Compare additionalProperties
  const apChanges = compareAdditionalProperties(oldNode, newNode, path);
  changes.push(...apChanges);

  // Compare items
  const itemsChanges = compareItems(oldNode, newNode, path);
  changes.push(...itemsChanges);

  // Compare anyOf/oneOf (composition keywords)
  const compositionChanges = compareComposition(oldNode, newNode, path);
  changes.push(...compositionChanges);

  return changes;
}

/**
 * Compare type field between two schema nodes
 */
function compareType(
  oldNode: SchemaNode,
  newNode: SchemaNode,
  path: string
): Change[] {
  const oldTypes = normalizeTypes(oldNode.type);
  const newTypes = normalizeTypes(newNode.type);

  // Both undefined - no change
  if (oldTypes.size === 0 && newTypes.size === 0) {
    return [];
  }

  // Type added
  if (oldTypes.size === 0 && newTypes.size > 0) {
    return [createChange(
      path ? `${path}.type` : 'type',
      'added',
      undefined,
      newNode.type
    )];
  }

  // Type removed
  if (oldTypes.size > 0 && newTypes.size === 0) {
    return [createChange(
      path ? `${path}.type` : 'type',
      'removed',
      oldNode.type,
      undefined
    )];
  }

  // Both have types - compare them
  const diff = setDifference(oldTypes, newTypes);

  // No difference
  if (diff.added.length === 0 && diff.removed.length === 0) {
    return [];
  }

  // Determine if this is narrowing or widening or complete change
  const oldTypeArr = [...oldTypes].sort();
  const newTypeArr = [...newTypes].sort();

  // Narrowed: new types are a subset of old types (types were removed)
  if (diff.added.length === 0 && diff.removed.length > 0) {
    return [createChange(
      path ? `${path}.type` : 'type',
      'narrowed',
      oldNode.type,
      newNode.type
    )];
  }

  // Widened or changed: new types were added
  // We classify as 'changed' for now (annotate phase will determine severity)
  return [createChange(
    path ? `${path}.type` : 'type',
    'changed',
    oldNode.type,
    newNode.type
  )];
}

/**
 * Compare properties between two schema nodes
 */
function compareProperties(
  oldNode: SchemaNode,
  newNode: SchemaNode,
  path: string
): Change[] {
  const changes: Change[] = [];

  const oldProps = oldNode.properties || {};
  const newProps = newNode.properties || {};

  const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

  for (const key of allKeys) {
    const propPath = path ? `${path}.properties.${key}` : `properties.${key}`;
    const oldProp = oldProps[key];
    const newProp = newProps[key];

    if (!oldProp && newProp) {
      // Property added
      changes.push(createChange(propPath, 'added', undefined, newProp));
    } else if (oldProp && !newProp) {
      // Property removed
      changes.push(createChange(propPath, 'removed', oldProp, undefined));
    } else if (oldProp && newProp) {
      // Property exists in both - recurse
      const nestedChanges = collectChanges(oldProp, newProp, propPath);
      changes.push(...nestedChanges);
    }
  }

  return changes;
}

/**
 * Compare required arrays between two schema nodes
 */
function compareRequired(
  oldNode: SchemaNode,
  newNode: SchemaNode,
  path: string
): Change[] {
  const oldRequired = new Set(oldNode.required || []);
  const newRequired = new Set(newNode.required || []);

  // No required in either
  if (oldRequired.size === 0 && newRequired.size === 0) {
    return [];
  }

  // Compare as arrays
  const oldArr = [...oldRequired].sort();
  const newArr = [...newRequired].sort();

  // No change
  if (JSON.stringify(oldArr) === JSON.stringify(newArr)) {
    return [];
  }

  // Required changed
  const requiredPath = path ? `${path}.required` : 'required';
  return [createChange(
    requiredPath,
    'changed',
    oldNode.required || [],
    newNode.required || []
  )];
}

/**
 * Compare additionalProperties between two schema nodes
 */
function compareAdditionalProperties(
  oldNode: SchemaNode,
  newNode: SchemaNode,
  path: string
): Change[] {
  const oldAp = oldNode.additionalProperties;
  const newAp = newNode.additionalProperties;

  // Both undefined - no change
  if (oldAp === undefined && newAp === undefined) {
    return [];
  }

  const apPath = path ? `${path}.additionalProperties` : 'additionalProperties';

  // One is undefined
  if (oldAp === undefined && newAp !== undefined) {
    return [createChange(apPath, 'added', undefined, newAp)];
  }

  if (oldAp !== undefined && newAp === undefined) {
    return [createChange(apPath, 'removed', oldAp, undefined)];
  }

  // Both are booleans
  if (typeof oldAp === 'boolean' && typeof newAp === 'boolean') {
    if (oldAp === newAp) {
      return [];
    }
    return [createChange(apPath, 'changed', oldAp, newAp)];
  }

  // Both are schemas - recurse
  if (typeof oldAp !== 'boolean' && typeof newAp !== 'boolean' && oldAp && newAp) {
    return collectChanges(oldAp, newAp, apPath);
  }

  // One is boolean, one is schema
  // This is a change in structure
  return [createChange(apPath, 'changed', oldAp, newAp)];
}

/**
 * Compare items between two schema nodes
 */
function compareItems(
  oldNode: SchemaNode,
  newNode: SchemaNode,
  path: string
): Change[] {
  const oldItems = oldNode.items;
  const newItems = newNode.items;

  // Both undefined - no change
  if (!oldItems && !newItems) {
    return [];
  }

  const itemsPath = path ? `${path}.items` : 'items';

  // Items added
  if (!oldItems && newItems) {
    return [createChange(itemsPath, 'added', undefined, newItems)];
  }

  // Items removed
  if (oldItems && !newItems) {
    return [createChange(itemsPath, 'removed', oldItems, undefined)];
  }

  // Both have items - recurse
  if (oldItems && newItems) {
    return collectChanges(oldItems, newItems, itemsPath);
  }

  return [];
}

/**
 * Compare composition keywords (anyOf/oneOf) between two schema nodes
 */
function compareComposition(
  oldNode: SchemaNode,
  newNode: SchemaNode,
  path: string
): Change[] {
  const changes: Change[] = [];

  // Compare anyOf
  const anyOfChanges = compareAlternatives(
    oldNode.anyOf,
    newNode.anyOf,
    path,
    'anyOf'
  );
  changes.push(...anyOfChanges);

  // Compare oneOf
  const oneOfChanges = compareAlternatives(
    oldNode.oneOf,
    newNode.oneOf,
    path,
    'oneOf'
  );
  changes.push(...oneOfChanges);

  return changes;
}

/**
 * Compare alternatives (anyOf or oneOf) between two schema nodes
 */
function compareAlternatives(
  oldAlternatives: SchemaNode[] | undefined,
  newAlternatives: SchemaNode[] | undefined,
  path: string,
  keyword: 'anyOf' | 'oneOf'
): Change[] {
  const changes: Change[] = [];

  const oldArr = oldAlternatives || [];
  const newArr = newAlternatives || [];

  // Both empty - no change
  if (oldArr.length === 0 && newArr.length === 0) {
    return [];
  }

  // Use index-based comparison for now
  // Find the maximum length to iterate
  const maxLen = Math.max(oldArr.length, newArr.length);

  for (let i = 0; i < maxLen; i++) {
    const altPath = path ? `${path}.${keyword}[${i}]` : `${keyword}[${i}]`;
    const oldAlt = oldArr[i];
    const newAlt = newArr[i];

    if (!oldAlt && newAlt) {
      // Alternative added
      changes.push(createChange(altPath, 'added', undefined, newAlt));
    } else if (oldAlt && !newAlt) {
      // Alternative removed
      changes.push(createChange(altPath, 'removed', oldAlt, undefined));
    } else if (oldAlt && newAlt) {
      // Both have alternative at this index - recurse
      const nestedChanges = collectChanges(oldAlt, newAlt, altPath);
      changes.push(...nestedChanges);
    }
  }

  return changes;
}
