/**
 * JSON Schema type literals as defined in JSON Schema specification
 */
export type SchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null';

/**
 * Structural representation of a JSON Schema node
 * Mirrors the schema structure with location metadata for error reporting
 */
export interface SchemaNode {
  // Core type information
  type?: SchemaType | SchemaType[];

  // Object keywords
  properties?: Record<string, SchemaNode>;
  required?: string[];
  additionalProperties?: boolean | SchemaNode;

  // Array keywords
  items?: SchemaNode;

  // Composition keywords
  allOf?: SchemaNode[];
  anyOf?: SchemaNode[];
  oneOf?: SchemaNode[];
  not?: SchemaNode;

  // Location metadata for error reporting
  _path?: string;

  // Computed flattened view (merges allOf)
  _flattened?: SchemaNode;

  // Alternative schemas from anyOf/oneOf
  _alternatives?: SchemaNode[];
}

/**
 * Validation error for schema parsing
 */
export interface ValidationError {
  path: string;
  message: string;
}

/**
 * Result of parsing a JSON Schema file
 */
export interface ParsedSchema {
  // Original structural representation
  original: SchemaNode;

  // Flattened representation (allOf merged)
  flattened: SchemaNode;

  // Critical errors (exit 1)
  errors: ValidationError[];

  // Consistency warnings (exit 0)
  warnings: ValidationError[];
}
