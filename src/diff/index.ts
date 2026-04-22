import type { ParsedSchema } from '../types.js';
import type { Change } from './types.js';
import { collectChanges } from './collect.js';
import { annotateChanges } from './annotate.js';
import { formatChanges } from './format.js';

/**
 * Result of running the diff pipeline
 */
export interface DiffResult {
  /** Formatted text output (or "No changes detected.") */
  output: string;
  
  /** Exit code (0 = no changes, 2 = non-breaking, 3 = breaking) */
  exitCode: number;
  
  /** Whether any breaking changes exist */
  breaking: boolean;
  
  /** Raw array of change objects */
  changes: Change[];
}

/**
 * Run the complete diff pipeline: collect → annotate → format
 * 
 * @param oldParsed - The parsed old schema
 * @param newParsed - The parsed new schema
 * @returns DiffResult with output, exitCode, breaking flag, and changes array
 */
export function runDiff(
  oldParsed: ParsedSchema,
  newParsed: ParsedSchema
): DiffResult {
  // Phase 1: Collect changes by comparing flattened schemas
  const changes: Change[] = collectChanges(
    oldParsed.flattened,
    newParsed.flattened
  );

  // No changes detected
  if (changes.length === 0) {
    return {
      output: 'No changes detected.',
      exitCode: 0,
      breaking: false,
      changes: [],
    };
  }

  // Phase 2: Annotate changes with breaking status
  const annotatedChanges = annotateChanges(changes);

  // Determine if any breaking changes exist
  const hasBreaking = annotatedChanges.some(c => c.breaking);

  // Phase 3: Format changes to text output
  const output = formatChanges(annotatedChanges);

  // Determine exit code
  // 2 = changes exist, all non-breaking
  // 3 = breaking changes present
  const exitCode = hasBreaking ? 3 : 2;

  return {
    output,
    exitCode,
    breaking: hasBreaking,
    changes: annotatedChanges,
  };
}
