/**
 * Data Layer Module
 * Persistence layer for tdo — JSON file store at ~/.tdo.json
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// Types
export interface Todo {
  id: number;
  text: string;
}

export interface DataFile {
  nextId: number;
  todos: Todo[];
}

// Error Classes
export class CorruptDataError extends Error {
  path: string;
  reason: string;

  constructor(filePath: string, reason: string) {
    super(`Corrupt data in ${filePath}: ${reason}`);
    this.name = 'CorruptDataError';
    this.path = filePath;
    this.reason = reason;
    Object.setPrototypeOf(this, CorruptDataError.prototype);
  }
}

export class SchemaValidationError extends Error {
  path: string;
  issues: string[];

  constructor(filePath: string, issues: string[]) {
    super(`Schema validation failed for ${filePath}: ${issues.join(', ')}`);
    this.name = 'SchemaValidationError';
    this.path = filePath;
    this.issues = issues;
    Object.setPrototypeOf(this, SchemaValidationError.prototype);
  }
}

// Path Resolution
function resolvePath(customPath?: string): string {
  return customPath ?? path.join(os.homedir(), '.tdo.json');
}

// Load Function
export function load(filePath?: string): DataFile {
  const resolvedPath = resolvePath(filePath);

  // Return empty data if file doesn't exist
  if (!fs.existsSync(resolvedPath)) {
    return { todos: [], nextId: 1 };
  }

  // Read and parse file
  let content: string;
  try {
    content = fs.readFileSync(resolvedPath, 'utf-8');
  } catch (err) {
    throw err; // Re-throw filesystem errors (EACCES, ENOSPC, etc.)
  }

  // Parse JSON
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch (err) {
    throw new CorruptDataError(resolvedPath, 'Invalid JSON format');
  }

  // Validate schema
  const issues: string[] = [];

  if (typeof data !== 'object' || data === null) {
    issues.push('root must be an object');
    throw new SchemaValidationError(resolvedPath, issues);
  }

  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.todos)) {
    issues.push('todos must be an array');
  }

  if (typeof obj.nextId !== 'number') {
    issues.push('nextId must be a number');
  }

  if (issues.length > 0) {
    throw new SchemaValidationError(resolvedPath, issues);
  }

  return data as DataFile;
}

// Save Function
export function save(data: DataFile, filePath?: string): void {
  const resolvedPath = resolvePath(filePath);
  const dir = path.dirname(resolvedPath);

  // Create parent directories if needed
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write pretty-printed JSON
  const content = JSON.stringify(data, null, 2);
  fs.writeFileSync(resolvedPath, content, 'utf-8');
}
