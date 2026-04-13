/**
 * Tests for data-layer module
 * Tests AC1-10, AC12
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// Import the module under test (will fail until implemented)
import {
  load,
  save,
  type Todo,
  type DataFile,
  CorruptDataError,
  SchemaValidationError,
} from './data-layer.js';

describe('Data Layer Module', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tdo-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Exports', () => {
    it('should export load function', () => {
      assert.strictEqual(typeof load, 'function');
    });

    it('should export save function', () => {
      assert.strictEqual(typeof save, 'function');
    });

    it('should export CorruptDataError class', () => {
      assert.strictEqual(typeof CorruptDataError, 'function');
      const err = new CorruptDataError('/test', 'reason');
      assert.ok(err instanceof Error);
      assert.strictEqual(err.name, 'CorruptDataError');
    });

    it('should export SchemaValidationError class', () => {
      assert.strictEqual(typeof SchemaValidationError, 'function');
      const err = new SchemaValidationError('/test', ['issue']);
      assert.ok(err instanceof Error);
      assert.strictEqual(err.name, 'SchemaValidationError');
    });
  });

  describe('load()', () => {
    // AC1: load() returns { todos: [], nextId: 1 } when file does not exist
    it('AC1: should return empty data when file does not exist', () => {
      const result = load(path.join(tempDir, 'nonexistent.json'));
      assert.deepStrictEqual(result, { todos: [], nextId: 1 });
    });

    // AC2: load() returns parsed { todos, nextId } when file exists and is valid
    it('AC2: should return parsed data when file exists and is valid', () => {
      const filePath = path.join(tempDir, 'valid.json');
      const validData = { nextId: 3, todos: [{ id: 1, text: 'Buy groceries' }, { id: 2, text: 'Write tests' }] };
      fs.writeFileSync(filePath, JSON.stringify(validData, null, 2));

      const result = load(filePath);
      assert.deepStrictEqual(result, validData);
    });

    // AC3: load() throws CorruptDataError when file exists but contains invalid JSON
    it('AC3: should throw CorruptDataError for invalid JSON', () => {
      const filePath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(filePath, '{ not valid json');

      assert.throws(
        () => load(filePath),
        (err) => {
          assert.ok(err instanceof CorruptDataError);
          assert.strictEqual(err.path, filePath);
          assert.ok(err.reason.length > 0);
          return true;
        }
      );
    });

    // AC4: load() throws SchemaValidationError when todos is not an array
    it('AC4: should throw SchemaValidationError when todos is not an array', () => {
      const filePath = path.join(tempDir, 'bad-todos.json');
      fs.writeFileSync(filePath, JSON.stringify({ nextId: 1, todos: 'not an array' }));

      assert.throws(
        () => load(filePath),
        (err) => {
          assert.ok(err instanceof SchemaValidationError);
          assert.strictEqual(err.path, filePath);
          assert.ok(err.issues.some((i: string) => i.includes('todos')));
          return true;
        }
      );
    });

    // AC5: load() throws SchemaValidationError when nextId is not a number
    it('AC5: should throw SchemaValidationError when nextId is not a number', () => {
      const filePath = path.join(tempDir, 'bad-nextid.json');
      fs.writeFileSync(filePath, JSON.stringify({ nextId: 'not a number', todos: [] }));

      assert.throws(
        () => load(filePath),
        (err) => {
          assert.ok(err instanceof SchemaValidationError);
          assert.strictEqual(err.path, filePath);
          assert.ok(err.issues.some((i: string) => i.includes('nextId')));
          return true;
        }
      );
    });

    // AC6: load('/custom/path.json') uses the provided path instead of default
    it('AC6: should use provided custom path', () => {
      const customPath = path.join(tempDir, 'custom-location.json');
      const validData = { nextId: 5, todos: [{ id: 1, text: 'Test' }] };
      fs.writeFileSync(customPath, JSON.stringify(validData, null, 2));

      const result = load(customPath);
      assert.deepStrictEqual(result, validData);
    });
  });

  describe('save()', () => {
    // AC7: save({ todos: [], nextId: 1 }) creates file at default path with correct JSON
    it('AC7: should create file at default path', () => {
      const defaultPath = path.join(os.homedir(), '.tdo.json');
      const backupPath = path.join(tempDir, 'backup-default.json');
      
      // Backup existing file if present
      if (fs.existsSync(defaultPath)) {
        fs.copyFileSync(defaultPath, backupPath);
        fs.unlinkSync(defaultPath);
      }

      try {
        const data: DataFile = { todos: [], nextId: 1 };
        save(data);

        assert.ok(fs.existsSync(defaultPath));
        const written = JSON.parse(fs.readFileSync(defaultPath, 'utf-8'));
        assert.deepStrictEqual(written, data);
      } finally {
        // Cleanup
        if (fs.existsSync(defaultPath)) {
          fs.unlinkSync(defaultPath);
        }
        if (fs.existsSync(backupPath)) {
          fs.copyFileSync(backupPath, defaultPath);
        }
      }
    });

    // AC8: save({ todos: [], nextId: 1 }, '/custom/path.json') creates file at custom path
    it('AC8: should create file at custom path', () => {
      const customPath = path.join(tempDir, 'custom-save.json');
      const data: DataFile = { todos: [], nextId: 1 };

      save(data, customPath);

      assert.ok(fs.existsSync(customPath));
      const written = JSON.parse(fs.readFileSync(customPath, 'utf-8'));
      assert.deepStrictEqual(written, data);
    });

    // AC9: save() creates parent directories if they don't exist
    it('AC9: should create parent directories if they do not exist', () => {
      const nestedPath = path.join(tempDir, 'deeply', 'nested', 'dir', 'file.json');
      const data: DataFile = { todos: [], nextId: 1 };

      save(data, nestedPath);

      assert.ok(fs.existsSync(nestedPath));
    });

    // AC10: Saved file is valid JSON matching DataFile schema
    it('AC10: saved file should be valid JSON matching DataFile schema', () => {
      const filePath = path.join(tempDir, 'schema-test.json');
      const data: DataFile = {
        nextId: 3,
        todos: [
          { id: 1, text: 'Buy groceries' },
          { id: 2, text: 'Write tests' },
        ],
      };

      save(data, filePath);

      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);

      assert.strictEqual(typeof parsed.nextId, 'number');
      assert.ok(Array.isArray(parsed.todos));
      assert.strictEqual(parsed.todos.length, 2);
      assert.strictEqual(parsed.todos[0].id, 1);
      assert.strictEqual(typeof parsed.todos[0].text, 'string');
    });
  });
});
