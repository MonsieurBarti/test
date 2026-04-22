import type { Change } from './types.js';
import type { SchemaType } from '../types.js';
import { setDifference, normalizeTypes } from '../utils.js';

/**
 * Annotate changes with breaking status based on conservative definition
 * 
 * A change is breaking if it could reject data that was valid under the old schema.
 * A change is non-breaking if it only expands what's valid.
 * 
 * @param changes - Array of Change objects with breaking=false placeholder
 * @returns Array of Change objects with breaking flag set
 */
export function annotateChanges(changes: Change[]): Change[] {
  return changes.map(change => ({
    ...change,
    breaking: determineBreaking(change),
  }));
}

/**
 * Determine if a change is breaking based on conservative definition
 */
function determineBreaking(change: Change): boolean {
  switch (change.kind) {
    case 'added':
      return isAddedBreaking(change);
    case 'removed':
      return isRemovedBreaking(change);
    case 'changed':
      return isChangedBreaking(change);
    case 'narrowed':
      return isNarrowedBreaking(change);
    default:
      // Unknown change kind - be conservative and mark as breaking
      return true;
  }
}

/**
 * Added changes are non-breaking except:
 * - Items added (constraint added)
 * - additionalProperties schema added (constraint added)
 * - anyOf/oneOf alternatives are non-breaking (more options)
 */
function isAddedBreaking(change: Change): boolean {
  const path = change.path;
  
  // Items added = adding constraint = breaking
  if (path === 'items' || path.endsWith('.items')) {
    return true;
  }
  
  // additionalProperties schema added = constraint added = breaking
  if (path === 'additionalProperties' || path.endsWith('.additionalProperties')) {
    // Check if the new value is a schema object (not just true)
    const newValue = change.newValue;
    if (newValue !== undefined && newValue !== true) {
      return true;
    }
    return false;
  }
  
  // Type added is non-breaking (schema becomes more specific but doesn't reject valid data)
  if (path === 'type' || path.endsWith('.type')) {
    return false;
  }
  
  // Property added is non-breaking
  // anyOf/oneOf alternative added is non-breaking
  return false;
}

/**
 * Removed changes are breaking except:
 * - additionalProperties schema removed (constraint removed = non-breaking)
 */
function isRemovedBreaking(change: Change): boolean {
  const path = change.path;
  
  // additionalProperties schema removed = constraint removed = non-breaking
  if (path === 'additionalProperties' || path.endsWith('.additionalProperties')) {
    return false;
  }
  
  // Everything else is breaking: property removed, items removed, type removed, alternative removed
  return true;
}

/**
 * Changed changes need to be analyzed based on what changed:
 * - Type change: breaking if types are incompatible or if some types were removed
 * - Required change: breaking if required properties were added
 * - additionalProperties boolean change: breaking if true -> false
 * - Other changes: be conservative and mark as breaking
 */
function isChangedBreaking(change: Change): boolean {
  const path = change.path;
  
  // Type change - check for widening vs narrowing vs incompatible
  if (path === 'type' || path.endsWith('.type')) {
    return isTypeChangeBreaking(change);
  }
  
  // Required change - check if required properties were added
  if (path === 'required' || path.endsWith('.required')) {
    return isRequiredChangeBreaking(change);
  }
  
  // additionalProperties change
  if (path === 'additionalProperties' || path.endsWith('.additionalProperties')) {
    return isAdditionalPropertiesChangeBreaking(change);
  }
  
  // Other changes - be conservative and mark as breaking
  // This includes property changes where the value changed (not the type)
  return true;
}

/**
 * Check if a type change is breaking
 * 
 * Breaking if:
 * - Types were removed (narrowing)
 * - Types changed to incompatible types
 * 
 * Non-breaking if:
 * - Types were added (widening)
 */
function isTypeChangeBreaking(change: Change): boolean {
  const oldTypes = normalizeTypes(change.oldValue as SchemaType | SchemaType[] | undefined);
  const newTypes = normalizeTypes(change.newValue as SchemaType | SchemaType[] | undefined);
  
  // If new types is a superset of old types, it's widening (non-breaking)
  // If new types is a subset of old types, it would have been classified as 'narrowed' already
  // So for 'changed', we check if types were both added and removed
  
  const diff = setDifference(oldTypes, newTypes);
  
  // If types were removed (and possibly also added), it could be breaking
  // But if only types were added, it's widening
  if (diff.removed.length === 0 && diff.added.length > 0) {
    // Only types added = widening = non-breaking
    return false;
  }
  
  // Types removed or both removed and added = potentially breaking
  return true;
}

/**
 * Check if a required change is breaking
 * 
 * Breaking if:
 * - Required properties were added
 * 
 * Non-breaking if:
 * - Required properties were removed
 */
function isRequiredChangeBreaking(change: Change): boolean {
  const oldRequired = new Set(change.oldValue as string[]);
  const newRequired = new Set(change.newValue as string[]);
  
  // Find properties that are now required but weren't before
  for (const prop of newRequired) {
    if (!oldRequired.has(prop)) {
      return true; // Property became required = breaking
    }
  }
  
  // No new required properties = non-breaking (some were removed)
  return false;
}

/**
 * Check if an additionalProperties change is breaking
 * 
 * Breaking if:
 * - true -> false (tightened)
 * - false -> schema (tightened)
 * 
 * Non-breaking if:
 * - false -> true (loosened)
 * - schema -> true (loosened)
 * - schema -> false (depends, but conservative says schema defines what's allowed, false rejects more)
 * 
 * Note: schema-to-schema changes would be handled by recursion in collect phase
 */
function isAdditionalPropertiesChangeBreaking(change: Change): boolean {
  const oldValue = change.oldValue;
  const newValue = change.newValue;
  
  // true -> false: breaking
  if (oldValue === true && newValue === false) {
    return true;
  }
  
  // false -> true: non-breaking
  if (oldValue === false && newValue === true) {
    return false;
  }
  
  // false -> schema: breaking (constraint added)
  if (oldValue === false && typeof newValue === 'object') {
    return true;
  }
  
  // true -> schema: breaking (constraint added)
  if (oldValue === true && typeof newValue === 'object') {
    return true;
  }
  
  // schema -> false: breaking (was schema-defined, now rejects all)
  if (typeof oldValue === 'object' && newValue === false) {
    return true;
  }
  
  // schema -> true: non-breaking (was constrained, now allows all)
  if (typeof oldValue === 'object' && newValue === true) {
    return false;
  }
  
  // Default: be conservative
  return true;
}

/**
 * Narrowed changes are always breaking
 * 
 * Narrowing means the schema now accepts fewer values than before,
 * which could reject data that was valid under the old schema.
 */
function isNarrowedBreaking(change: Change): boolean {
  // All narrowing is breaking
  return true;
}
