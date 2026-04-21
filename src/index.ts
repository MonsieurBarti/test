#!/usr/bin/env node
import { existsSync, readFileSync } from 'fs';

// Read version from package.json
function getVersion(): string {
  try {
    const pkgPath = new URL('../package.json', import.meta.url);
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

// Usage text
const USAGE = `schemadiff <old-schema.json> <new-schema.json>

Compare two JSON Schema files and identify differences.

Arguments:
  old-schema.json    Path to the original schema file
  new-schema.json    Path to the new schema file

Options:
  -h, --help         Show this help message
  -v, --version      Show version number

Exit codes:
  0  Success
  1  Error (file not found, invalid JSON, wrong arguments)`;

// Argument parsing result
interface ParseResult {
  type: 'help' | 'version' | 'error' | 'run';
  oldSchema?: string;
  newSchema?: string;
  error?: string;
}

// Parse CLI arguments
function parseArgs(args: string[]): ParseResult {
  if (args.length === 0) {
    return { type: 'error', error: 'Error: No arguments provided.\n\n' + USAGE };
  }

  for (const arg of args) {
    if (arg === '-h' || arg === '--help') {
      return { type: 'help' };
    }
    if (arg === '-v' || arg === '--version') {
      return { type: 'version' };
    }
  }

  const positional = args.filter(arg => !arg.startsWith('-'));
  
  if (positional.length !== 2) {
    return { type: 'error', error: 'Error: Expected exactly 2 schema file paths.\n\n' + USAGE };
  }

  return {
    type: 'run',
    oldSchema: positional[0],
    newSchema: positional[1]
  };
}

// Validation error type
interface ValidationError {
  path: string;
  message: string;
}

// Check if file exists
function validateFileExists(path: string): ValidationError | null {
  if (!existsSync(path)) {
    return { path, message: `Error: File not found: ${path}` };
  }
  return null;
}

// Parse and validate JSON
function validateJson(path: string): { data: unknown; error: ValidationError | null } {
  try {
    const content = readFileSync(path, 'utf-8');
    const data = JSON.parse(content);
    return { data, error: null };
  } catch (err) {
    const parseError = err instanceof Error ? err.message : String(err);
    return { 
      data: null, 
      error: { path, message: `Error: Invalid JSON in ${path}: ${parseError}` } 
    };
  }
}

// Validate JSON Schema structure
function validateJsonSchema(data: unknown, path: string): ValidationError | null {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { path, message: `Error: Not a valid JSON Schema: ${path} (must be an object)` };
  }
  
  const schema = data as Record<string, unknown>;
  if (!('$schema' in schema) && !('type' in schema)) {
    return { path, message: `Error: Not a valid JSON Schema: ${path} (missing $schema or type property)` };
  }
  
  return null;
}

// Main entry point
function main(): void {
  const args = process.argv.slice(2);
  const result = parseArgs(args);

  switch (result.type) {
    case 'help':
      console.log(USAGE);
      process.exit(0);
      break;

    case 'version':
      console.log(`schemadiff v${getVersion()}`);
      process.exit(0);
      break;

    case 'error':
      console.error(result.error);
      process.exit(1);
      break;

    case 'run':
      // Validate first schema file
      let error = validateFileExists(result.oldSchema!);
      if (error) {
        console.error(error.message);
        process.exit(1);
      }

      let jsonResult = validateJson(result.oldSchema!);
      if (jsonResult.error) {
        console.error(jsonResult.error.message);
        process.exit(1);
      }

      error = validateJsonSchema(jsonResult.data, result.oldSchema!);
      if (error) {
        console.error(error.message);
        process.exit(1);
      }

      // Validate second schema file
      error = validateFileExists(result.newSchema!);
      if (error) {
        console.error(error.message);
        process.exit(1);
      }

      jsonResult = validateJson(result.newSchema!);
      if (jsonResult.error) {
        console.error(jsonResult.error.message);
        process.exit(1);
      }

      error = validateJsonSchema(jsonResult.data, result.newSchema!);
      if (error) {
        console.error(error.message);
        process.exit(1);
      }

      // Stub success message (actual diff logic in future slice)
      console.log('Both schemas are valid JSON Schemas.');
      console.log('Diff logic not yet implemented.');
      process.exit(0);
      break;
  }
}

main();
