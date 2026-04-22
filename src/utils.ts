import type { SchemaType } from './types.js';

/**
 * Deep clone a value using structuredClone (Node 17+)
 * Falls back to JSON.parse(JSON.stringify()) for older environments
 */
export function cloneDeep<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

/**
 * Check if a value is a plain object (not null, not array, typeof 'object')
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Compute the intersection of two arrays
 * Returns elements that exist in both arrays
 */
export function intersection<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b);
  return a.filter(item => setB.has(item));
}

/**
 * Compute the difference between two sets
 * Returns added elements (in b but not in a) and removed elements (in a but not in b)
 */
export function setDifference<T>(a: Set<T>, b: Set<T>): { added: T[]; removed: T[] } {
  const added: T[] = [];
  const removed: T[] = [];

  // Find elements in a that are not in b (removed)
  for (const item of a) {
    if (!b.has(item)) {
      removed.push(item);
    }
  }

  // Find elements in b that are not in a (added)
  for (const item of b) {
    if (!a.has(item)) {
      added.push(item);
    }
  }

  return { added, removed };
}

/**
 * Normalize the type field to a Set for uniform comparison
 * Handles single type string, array of types, or undefined
 */
export function normalizeTypes(type: SchemaType | SchemaType[] | undefined): Set<SchemaType> {
  if (type === undefined) {
    return new Set();
  }

  if (Array.isArray(type)) {
    return new Set(type);
  }

  return new Set([type]);
}
