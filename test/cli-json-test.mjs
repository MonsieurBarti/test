#!/usr/bin/env node
import { spawn } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Track async tests
let testsRunning = 0;
let testsFailed = false;

async function test(name, fn) {
  testsRunning++;
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  ${err.message}`);
    process.exitCode = 1;
    testsFailed = true;
  }
  testsRunning--;
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Helper to run CLI and capture output
function runCli(args) {
  return new Promise((resolve, reject) => {
    const cliPath = new URL('../dist/index.js', import.meta.url).pathname;
    const child = spawn('node', [cliPath, ...args], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code });
    });

    child.on('error', reject);
  });
}

// Create temp files for testing
const tempDir = join(tmpdir(), 'schemadiff-test-' + Date.now());
let tempFileCounter = 0;

function createTempSchema(content) {
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }
  const filename = `test-${++tempFileCounter}.json`;
  const filepath = join(tempDir, filename);
  writeFileSync(filepath, JSON.stringify(content));
  return filepath;
}

function cleanup() {
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

// Run all tests
async function runTests() {
  console.log('\n=== CLI JSON Output Tests ===\n');

  // AC-5: --help shows -j, --json option in help text
  await test('--help shows -j, --json option', async () => {
    const result = await runCli(['--help']);
    assertEqual(result.exitCode, 0, 'Exit code should be 0 for --help');
    assertTrue(result.stdout.includes('-j, --json'), 'Help text should include -j, --json option');
    assertTrue(result.stdout.includes('Output changes as JSON array'), 'Help text should describe JSON output');
  });

  // AC-6: -j short flag works (identical schemas, empty array)
  await test('-j with identical schemas outputs empty JSON array, exits 0', async () => {
    const schema = { type: 'object', properties: { name: { type: 'string' } } };
    const file = createTempSchema(schema);
    
    try {
      const result = await runCli(['-j', file, file]);
      assertEqual(result.exitCode, 0, 'Exit code should be 0 for identical schemas');
      
      const parsed = JSON.parse(result.stdout);
      assertTrue(Array.isArray(parsed), 'Output should be a JSON array');
      assertEqual(parsed.length, 0, 'Array should be empty');
    } finally {
      cleanup();
    }
  });

  // AC-1: --json with identical schemas outputs [], exits 0
  await test('--json with identical schemas outputs empty JSON array, exits 0', async () => {
    const schema = { type: 'object', properties: { name: { type: 'string' } } };
    const file = createTempSchema(schema);
    
    try {
      const result = await runCli(['--json', file, file]);
      assertEqual(result.exitCode, 0, 'Exit code should be 0 for identical schemas');
      
      const parsed = JSON.parse(result.stdout);
      assertTrue(Array.isArray(parsed), 'Output should be a JSON array');
      assertEqual(parsed.length, 0, 'Array should be empty');
    } finally {
      cleanup();
    }
  });

  // AC-2: --json with non-breaking changes outputs valid JSON, exits 2
  await test('--json with non-breaking changes outputs valid JSON array, exits 2', async () => {
    const oldSchema = { type: 'object', properties: { name: { type: 'string' } } };
    const newSchema = { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' } } };
    
    const oldFile = createTempSchema(oldSchema);
    const newFile = createTempSchema(newSchema);
    
    try {
      const result = await runCli(['--json', oldFile, newFile]);
      assertEqual(result.exitCode, 2, 'Exit code should be 2 for non-breaking changes');
      
      const parsed = JSON.parse(result.stdout);
      assertTrue(Array.isArray(parsed), 'Output should be a JSON array');
      assertTrue(parsed.length > 0, 'Array should have changes');
      
      // All changes should be non-breaking
      assertTrue(parsed.every(c => c.breaking === false), 'All changes should be non-breaking');
    } finally {
      cleanup();
    }
  });

  // AC-3: --json with breaking changes outputs valid JSON, exits 3
  await test('--json with breaking changes outputs valid JSON array, exits 3', async () => {
    const oldSchema = { type: 'object', properties: { name: { type: 'string' }, username: { type: 'string' } } };
    const newSchema = { type: 'object', properties: { name: { type: 'string' } } };
    
    const oldFile = createTempSchema(oldSchema);
    const newFile = createTempSchema(newSchema);
    
    try {
      const result = await runCli(['--json', oldFile, newFile]);
      assertEqual(result.exitCode, 3, 'Exit code should be 3 for breaking changes');
      
      const parsed = JSON.parse(result.stdout);
      assertTrue(Array.isArray(parsed), 'Output should be a JSON array');
      assertTrue(parsed.length > 0, 'Array should have changes');
      
      // Should have at least one breaking change
      assertTrue(parsed.some(c => c.breaking === true), 'Should have at least one breaking change');
    } finally {
      cleanup();
    }
  });

  // AC-4: Error handling unchanged (file not found)
  await test('--json with missing file outputs error to stderr, exits 1', async () => {
    const schema = { type: 'object' };
    const file = createTempSchema(schema);
    
    try {
      const result = await runCli(['--json', '/nonexistent/file.json', file]);
      assertEqual(result.exitCode, 1, 'Exit code should be 1 for missing file');
      assertTrue(result.stderr.length > 0, 'Should have error message on stderr');
      assertTrue(result.stderr.includes('File not found'), 'Error should mention file not found');
    } finally {
      cleanup();
    }
  });

  // AC-7: Output is valid JSON (parsable)
  await test('--json output is valid JSON', async () => {
    const oldSchema = { type: 'string' };
    const newSchema = { type: 'number' };
    
    const oldFile = createTempSchema(oldSchema);
    const newFile = createTempSchema(newSchema);
    
    try {
      const result = await runCli(['--json', oldFile, newFile]);
      
      // Should not throw on parse
      let parsed;
      try {
        parsed = JSON.parse(result.stdout);
      } catch (e) {
        throw new Error(`Output is not valid JSON: ${result.stdout}`);
      }
      
      assertTrue(Array.isArray(parsed), 'Output should be a JSON array');
    } finally {
      cleanup();
    }
  });

  // AC-8: JSON array is sorted correctly (breaking first, then non-breaking, each alphabetically)
  await test('--json output is sorted: breaking first, then non-breaking, each alphabetically', async () => {
    const oldSchema = {
      type: 'object',
      properties: {
        zzz_nonbreaking: { type: 'string' },
        aaa_breaking: { type: 'string' },
        mmm_nonbreaking: { type: 'string' }
      }
    };
    const newSchema = {
      type: 'object',
      properties: {
        zzz_nonbreaking: { type: 'string' },
        aaa_breaking: { type: 'number' },  // changed type - breaking
        mmm_nonbreaking: { type: 'string' },
        bbb_added: { type: 'string' }  // added - non-breaking
      }
    };
    
    const oldFile = createTempSchema(oldSchema);
    const newFile = createTempSchema(newSchema);
    
    try {
      const result = await runCli(['--json', oldFile, newFile]);
      const parsed = JSON.parse(result.stdout);
      
      // Separate breaking and non-breaking
      const breaking = parsed.filter(c => c.breaking);
      const nonBreaking = parsed.filter(c => !c.breaking);
      
      // Check breaking are first in output
      const firstNonBreakingIndex = parsed.findIndex(c => !c.breaking);
      const lastBreakingIndex = parsed.map((c, i) => c.breaking ? i : -1).filter(i => i >= 0).pop();
      
      if (breaking.length > 0 && nonBreaking.length > 0) {
        assertTrue(lastBreakingIndex < firstNonBreakingIndex, 'Breaking changes should come before non-breaking');
      }
      
      // Check alphabetical sorting within breaking
      for (let i = 1; i < breaking.length; i++) {
        assertTrue(breaking[i-1].path <= breaking[i].path, 'Breaking changes should be sorted alphabetically');
      }
      
      // Check alphabetical sorting within non-breaking
      for (let i = 1; i < nonBreaking.length; i++) {
        assertTrue(nonBreaking[i-1].path <= nonBreaking[i].path, 'Non-breaking changes should be sorted alphabetically');
      }
    } finally {
      cleanup();
    }
  });

  // AC-9: "added" changes have no oldValue field
  await test('--json added changes have no oldValue field', async () => {
    const oldSchema = { type: 'object', properties: { name: { type: 'string' } } };
    const newSchema = { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' } } };
    
    const oldFile = createTempSchema(oldSchema);
    const newFile = createTempSchema(newSchema);
    
    try {
      const result = await runCli(['--json', oldFile, newFile]);
      const parsed = JSON.parse(result.stdout);
      
      const added = parsed.find(c => c.kind === 'added');
      assertTrue(added !== undefined, 'Should have an added change');
      assertTrue(!('oldValue' in added), 'Added change should not have oldValue field');
      assertTrue('newValue' in added, 'Added change should have newValue field');
    } finally {
      cleanup();
    }
  });

  // AC-10: "removed" changes have no newValue field
  await test('--json removed changes have no newValue field', async () => {
    const oldSchema = { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' } } };
    const newSchema = { type: 'object', properties: { name: { type: 'string' } } };
    
    const oldFile = createTempSchema(oldSchema);
    const newFile = createTempSchema(newSchema);
    
    try {
      const result = await runCli(['--json', oldFile, newFile]);
      const parsed = JSON.parse(result.stdout);
      
      const removed = parsed.find(c => c.kind === 'removed');
      assertTrue(removed !== undefined, 'Should have a removed change');
      assertTrue('oldValue' in removed, 'Removed change should have oldValue field');
      assertTrue(!('newValue' in removed), 'Removed change should not have newValue field');
    } finally {
      cleanup();
    }
  });

  // AC-11: "changed"/"narrowed" changes have both oldValue and newValue fields
  await test('--json changed changes have both oldValue and newValue fields', async () => {
    const oldSchema = { type: 'string' };
    const newSchema = { type: 'number' };
    
    const oldFile = createTempSchema(oldSchema);
    const newFile = createTempSchema(newSchema);
    
    try {
      const result = await runCli(['--json', oldFile, newFile]);
      const parsed = JSON.parse(result.stdout);
      
      const changed = parsed.find(c => c.kind === 'changed');
      assertTrue(changed !== undefined, 'Should have a changed change');
      assertTrue('oldValue' in changed, 'Changed change should have oldValue field');
      assertTrue('newValue' in changed, 'Changed change should have newValue field');
    } finally {
      cleanup();
    }
  });

  await test('--json narrowed changes have both oldValue and newValue fields', async () => {
    const oldSchema = { type: ['string', 'null'] };
    const newSchema = { type: 'string' };
    
    const oldFile = createTempSchema(oldSchema);
    const newFile = createTempSchema(newSchema);
    
    try {
      const result = await runCli(['--json', oldFile, newFile]);
      const parsed = JSON.parse(result.stdout);
      
      const narrowed = parsed.find(c => c.kind === 'narrowed');
      assertTrue(narrowed !== undefined, 'Should have a narrowed change');
      assertTrue('oldValue' in narrowed, 'Narrowed change should have oldValue field');
      assertTrue('newValue' in narrowed, 'Narrowed change should have newValue field');
    } finally {
      cleanup();
    }
  });

  console.log('\n=== Done ===\n');
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
