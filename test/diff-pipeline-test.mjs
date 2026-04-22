#!/usr/bin/env node
import { runDiff } from '../dist/diff/index.js';
import { parseSchema } from '../dist/parser.js';

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  ${err.message}`);
    process.exitCode = 1;
  }
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

console.log('\n=== Diff Pipeline Tests ===\n');

// AC-1: Identical schemas exit 0, print "No changes detected."
test('identical schemas exit 0 with no changes message', () => {
  const schema = { type: 'object', properties: { name: { type: 'string' } } };
  const oldParsed = parseSchema(schema);
  const newParsed = parseSchema(schema);
  
  const result = runDiff(oldParsed, newParsed);
  assertEqual(result.exitCode, 0, 'Exit code should be 0 for identical schemas');
  assertEqual(result.output, 'No changes detected.', 'Should print "No changes detected."');
});

// AC-2: Property added exits 2, prints + properties.newprop
test('property added exits 2 with + prefix', () => {
  const oldSchema = { type: 'object', properties: { name: { type: 'string' } } };
  const newSchema = { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' } } };
  
  const oldParsed = parseSchema(oldSchema);
  const newParsed = parseSchema(newSchema);
  
  const result = runDiff(oldParsed, newParsed);
  assertEqual(result.exitCode, 2, 'Exit code should be 2 for non-breaking changes');
  assertTrue(result.output.includes('+ properties.email'), 'Should include + properties.email');
});

// AC-3: Property removed exits 3, prints ! - properties.oldprop
test('property removed exits 3 with ! - prefix', () => {
  const oldSchema = { type: 'object', properties: { name: { type: 'string' }, username: { type: 'string' } } };
  const newSchema = { type: 'object', properties: { name: { type: 'string' } } };
  
  const oldParsed = parseSchema(oldSchema);
  const newParsed = parseSchema(newSchema);
  
  const result = runDiff(oldParsed, newParsed);
  assertEqual(result.exitCode, 3, 'Exit code should be 3 for breaking changes');
  assertTrue(result.output.includes('! - properties.username'), 'Should include ! - properties.username');
});

// AC-4: Type changes string→number exits 3, prints ! ~ type: string → number
test('type changed exits 3 with ! ~ prefix', () => {
  const oldSchema = { type: 'string' };
  const newSchema = { type: 'number' };
  
  const oldParsed = parseSchema(oldSchema);
  const newParsed = parseSchema(newSchema);
  
  const result = runDiff(oldParsed, newParsed);
  assertEqual(result.exitCode, 3, 'Exit code should be 3 for breaking type change');
  assertTrue(result.output.includes('! ~ type: string → number'), 'Should include ! ~ type: string → number');
});

// Type widening (string -> string|null) exits 2 (non-breaking)
// This is actually widening since more types are allowed
test('type widened from single to multi-type exits 2', () => {
  const oldSchema = { type: 'string' };
  const newSchema = { type: ['string', 'null'] };
  
  const oldParsed = parseSchema(oldSchema);
  const newParsed = parseSchema(newSchema);
  
  const result = runDiff(oldParsed, newParsed);
  assertEqual(result.exitCode, 2, 'Exit code should be 2 for widening (non-breaking)');
  assertTrue(result.output.includes('~ type: string → string | null'), 'Should format as changed (widening)');
});

// AC-5 corrected: Type narrows from ['string', 'null'] to 'string' exits 3
test('type narrowed from multi-type to single exits 3', () => {
  const oldSchema = { type: ['string', 'null'] };
  const newSchema = { type: 'string' };
  
  const oldParsed = parseSchema(oldSchema);
  const newParsed = parseSchema(newSchema);
  
  const result = runDiff(oldParsed, newParsed);
  assertEqual(result.exitCode, 3, 'Exit code should be 3 for narrowing');
  assertTrue(result.output.includes('! < type: string | null → string'), 'Should include ! < type: string | null → string');
});

// AC-6: Property becomes required exits 3, prints ! ~ required
test('property becomes required exits 3', () => {
  const oldSchema = { type: 'object', properties: { name: { type: 'string' } } };
  const newSchema = { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] };
  
  const oldParsed = parseSchema(oldSchema);
  const newParsed = parseSchema(newSchema);
  
  const result = runDiff(oldParsed, newParsed);
  assertEqual(result.exitCode, 3, 'Exit code should be 3 for property becoming required');
  assertTrue(result.output.includes('required'), 'Should mention required');
  assertTrue(result.breaking, 'Should have breaking changes');
});

// AC-7: anyOf alternative added exits 2, prints + anyOf[1]
test('anyOf alternative added exits 2', () => {
  const oldSchema = { anyOf: [{ type: 'string' }] };
  const newSchema = { anyOf: [{ type: 'string' }, { type: 'number' }] };
  
  const oldParsed = parseSchema(oldSchema);
  const newParsed = parseSchema(newSchema);
  
  const result = runDiff(oldParsed, newParsed);
  assertEqual(result.exitCode, 2, 'Exit code should be 2 for non-breaking anyOf addition');
  assertTrue(result.output.includes('+ anyOf[1]'), 'Should include + anyOf[1]');
});

// AC-8: anyOf alternative removed exits 3, prints ! - anyOf[1]
test('anyOf alternative removed exits 3', () => {
  const oldSchema = { anyOf: [{ type: 'string' }, { type: 'number' }] };
  const newSchema = { anyOf: [{ type: 'string' }] };
  
  const oldParsed = parseSchema(oldSchema);
  const newParsed = parseSchema(newSchema);
  
  const result = runDiff(oldParsed, newParsed);
  assertEqual(result.exitCode, 3, 'Exit code should be 3 for breaking anyOf removal');
  assertTrue(result.output.includes('! - anyOf[1]'), 'Should include ! - anyOf[1]');
});

// Test: empty schemas
test('empty schemas have no changes', () => {
  const oldParsed = parseSchema({});
  const newParsed = parseSchema({});
  
  const result = runDiff(oldParsed, newParsed);
  assertEqual(result.exitCode, 0, 'Exit code should be 0 for empty schemas');
  assertEqual(result.output, 'No changes detected.', 'Should print "No changes detected."');
});

// Test: complex schema with multiple changes
test('complex schema with multiple changes', () => {
  const oldSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'integer' }
    }
  };
  const newSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'string' },  // changed type (breaking)
      email: { type: 'string' }  // added (non-breaking)
    }
  };
  
  const oldParsed = parseSchema(oldSchema);
  const newParsed = parseSchema(newSchema);
  
  const result = runDiff(oldParsed, newParsed);
  assertEqual(result.exitCode, 3, 'Exit code should be 3 for mixed changes with breaking');
  assertTrue(result.output.includes('properties.age.type'), 'Should include age type change');
  assertTrue(result.output.includes('properties.email'), 'Should include email addition');
});

// Test: result object structure
test('runDiff returns correct structure', () => {
  const oldParsed = parseSchema({ type: 'string' });
  const newParsed = parseSchema({ type: 'number' });
  
  const result = runDiff(oldParsed, newParsed);
  
  assertTrue('output' in result, 'Result should have output property');
  assertTrue('exitCode' in result, 'Result should have exitCode property');
  assertTrue('breaking' in result, 'Result should have breaking property');
  
  assertEqual(typeof result.output, 'string', 'output should be a string');
  assertEqual(typeof result.exitCode, 'number', 'exitCode should be a number');
  assertEqual(typeof result.breaking, 'boolean', 'breaking should be a boolean');
});

console.log('\n=== Done ===\n');
