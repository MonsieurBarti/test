#!/usr/bin/env node
import { existsSync, readFileSync } from 'fs';
import { parseSchema, hasErrors, printErrors, printWarnings } from './parser.js';

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

// Check if file exists
function validateFileExists(path: string): { message: string } | null {
  if (!existsSync(path)) {
    return { message: `Error: File not found: ${path}` };
  }
  return null;
}

// Parse and validate JSON from file
function loadJsonFile(path: string): { data: unknown; error: { message: string } | null } {
  try {
    const content = readFileSync(path, 'utf-8');
    const data = JSON.parse(content);
    return { data, error: null };
  } catch (err) {
    const parseError = err instanceof Error ? err.message : String(err);
    return { 
      data: null, 
      error: { message: `Error: Invalid JSON in ${path}: ${parseError}` } 
    };
  }
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
      // Load and parse first schema file
      let error = validateFileExists(result.oldSchema!);
      if (error) {
        console.error(error.message);
        process.exit(1);
      }

      let jsonResult = loadJsonFile(result.oldSchema!);
      if (jsonResult.error) {
        console.error(jsonResult.error.message);
        process.exit(1);
      }

      const oldParsed = parseSchema(jsonResult.data);
      if (hasErrors(oldParsed)) {
        printErrors(oldParsed);
        process.exit(1);
      }
      printWarnings(oldParsed);

      // Load and parse second schema file
      error = validateFileExists(result.newSchema!);
      if (error) {
        console.error(error.message);
        process.exit(1);
      }

      jsonResult = loadJsonFile(result.newSchema!);
      if (jsonResult.error) {
        console.error(jsonResult.error.message);
        process.exit(1);
      }

      const newParsed = parseSchema(jsonResult.data);
      if (hasErrors(newParsed)) {
        printErrors(newParsed);
        process.exit(1);
      }
      printWarnings(newParsed);

      // Parsed schemas are available for diff phase
      // _ = oldParsed, newParsed (stored in memory for next slice)

      console.log('Both schemas parsed successfully.');
      console.log('Diff logic will be implemented in the next slice.');
      process.exit(0);
      break;
  }
}

main();
