/**
 * Change kind classification for schema differences
 */
export type ChangeKind = 'added' | 'removed' | 'changed' | 'narrowed';

/**
 * Enum-like object for ChangeKind values (for runtime use)
 */
export const ChangeKind = {
  Added: 'added' as const,
  Removed: 'removed' as const,
  Changed: 'changed' as const,
  Narrowed: 'narrowed' as const,
};

/**
 * Represents a single change between two schema nodes
 */
export interface Change {
  /** JSON path to the changed element (e.g., "properties.email.type") */
  path: string;
  
  /** Classification of the change */
  kind: ChangeKind;
  
  /** Previous value (for removed/changed/narrowed) */
  oldValue?: unknown;
  
  /** New value (for added/changed/narrowed) */
  newValue?: unknown;
  
  /** Whether this change is breaking (set by annotate phase) */
  breaking: boolean;
}

/**
 * Create a Change object with initial breaking=false
 */
export function createChange(
  path: string,
  kind: ChangeKind,
  oldValue?: unknown,
  newValue?: unknown
): Change {
  return {
    path,
    kind,
    oldValue,
    newValue,
    breaking: false, // Set to false initially, updated in annotate phase
  };
}

/**
 * Type guard to check if a value is a valid Change object
 */
export function isChange(value: unknown): value is Change {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value !== 'object') {
    return false;
  }
  
  const candidate = value as Partial<Change>;
  
  return (
    typeof candidate.path === 'string' &&
    (candidate.kind === 'added' ||
      candidate.kind === 'removed' ||
      candidate.kind === 'changed' ||
      candidate.kind === 'narrowed') &&
    typeof candidate.breaking === 'boolean'
  );
}

/**
 * Check if a change is marked as breaking
 */
export function isBreaking(change: Change): boolean {
  return change.breaking;
}

/**
 * Check if change is an addition
 */
export function isAddition(change: Change): boolean {
  return change.kind === 'added';
}

/**
 * Check if change is a removal
 */
export function isRemoval(change: Change): boolean {
  return change.kind === 'removed';
}

/**
 * Check if change is a modification (type/value changed)
 */
export function isModification(change: Change): boolean {
  return change.kind === 'changed';
}

/**
 * Check if change is a narrowing (type constraint added)
 */
export function isNarrowing(change: Change): boolean {
  return change.kind === 'narrowed';
}
