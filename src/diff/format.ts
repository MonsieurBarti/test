import type { Change, ChangeKind } from './types.js';

/**
 * Format an array of changes into human-readable text output
 * 
 * Output format:
 * - Breaking changes first (sorted alphabetically by path)
 * - Non-breaking changes second (sorted alphabetically by path)
 * - Each line prefixed with:
 *   - `!` for breaking changes
 *   - `+` for added, `-` for removed, `~` for changed, `<` for narrowed
 * 
 * @param changes - Array of Change objects with breaking flag set
 * @returns Formatted string output, or empty string if no changes
 */
export function formatChanges(changes: Change[]): string {
  if (changes.length === 0) {
    return '';
  }

  // Separate breaking and non-breaking changes
  const breaking = changes.filter(c => c.breaking);
  const nonBreaking = changes.filter(c => !c.breaking);

  // Sort each group alphabetically by path
  breaking.sort((a, b) => a.path.localeCompare(b.path));
  nonBreaking.sort((a, b) => a.path.localeCompare(b.path));

  // Format each change
  const breakingLines = breaking.map(c => formatChange(c));
  const nonBreakingLines = nonBreaking.map(c => formatChange(c));

  // Combine: breaking first, then non-breaking
  const allLines = [...breakingLines, ...nonBreakingLines];

  return allLines.join('\n');
}

/**
 * Format a single change
 */
function formatChange(change: Change): string {
  const prefix = getPrefix(change.kind);
  const breakingPrefix = change.breaking ? '! ' : '';
  const valuePart = formatValue(change);

  if (valuePart) {
    return `${breakingPrefix}${prefix} ${change.path}: ${valuePart}`;
  } else {
    return `${breakingPrefix}${prefix} ${change.path}`;
  }
}

/**
 * Get the prefix for a change kind
 */
function getPrefix(kind: ChangeKind): string {
  switch (kind) {
    case 'added':
      return '+';
    case 'removed':
      return '-';
    case 'changed':
      return '~';
    case 'narrowed':
      return '<';
    default:
      return '?';
  }
}

/**
 * Format the value part of a change (for changed/narrowed kinds)
 * Returns empty string for added/removed without meaningful values
 */
function formatValue(change: Change): string {
  // For added/removed, we don't show values in the standard format
  if (change.kind === 'added' || change.kind === 'removed') {
    return '';
  }

  // For changed/narrowed, show old → new
  const oldStr = formatTypeValue(change.oldValue, change.path);
  const newStr = formatTypeValue(change.newValue, change.path);

  return `${oldStr} → ${newStr}`;
}

/**
 * Format a type value for display
 * Handles strings, arrays (multi-type), and other values
 * 
 * @param value - The value to format
 * @param path - The path of the change (to determine if this is a type field)
 */
function formatTypeValue(value: unknown, path: string): string {
  if (value === undefined) {
    return 'undefined';
  }

  // Handle arrays
  if (Array.isArray(value)) {
    // Multi-type arrays (for 'type' fields) should be formatted with pipes
    if (path === 'type' || path.endsWith('.type') || path.endsWith('.type]')) {
      return value.join(' | ');
    }
    // Other arrays (like 'required') should be JSON formatted
    return JSON.stringify(value);
  }

  // Handle objects
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }

  // Handle primitives
  return String(value);
}
