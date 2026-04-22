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
