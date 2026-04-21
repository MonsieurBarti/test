#!/usr/bin/env node
import { readFileSync } from 'fs';
import { parseSchema, hasErrors, printErrors, printWarnings } from '../dist/parser.js';

function loadJson(path) {
  const content = readFileSync(path, 'utf-8');
  return JSON.parse(content);
}

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
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

console.log('\n=== Parser Validation Tests ===\n');

// AC-1: valid core-only schema should have no errors
test('AC-1: valid core schema has no errors', () => {
  const raw = loadJson('test/fixtures/core.json');
  const parsed = parseSchema(raw);
  assertEqual(parsed.errors.length, 0, 'Should have no errors');
});

// AC-2: valid composition schema should have no errors
test('AC-2: valid composition schema has no errors', () => {
  const raw = loadJson('test/fixtures/comp.json');
  const parsed = parseSchema(raw);
  assertEqual(parsed.errors.length, 0, 'Should have no errors');
});

// AC-3: invalid type should produce error
test('AC-3: invalid type produces error', () => {
  const raw = loadJson('test/fixtures/bad-type.json');
  const parsed = parseSchema(raw);
  assertEqual(parsed.errors.length, 1, 'Should have 1 error');
  assertTrue(parsed.errors[0].message.includes('Invalid type'), 'Error should mention invalid type');
});

// AC-4: required property missing should produce error
test('AC-4: missing required property produces error', () => {
  const raw = loadJson('test/fixtures/bad-required.json');
  const parsed = parseSchema(raw);
  assertEqual(parsed.errors.length, 1, 'Should have 1 error');
  assertTrue(parsed.errors[0].message.includes('does not exist'), 'Error should mention missing property');
});

// AC-5: malformed composition should produce error
test('AC-5: malformed composition produces error', () => {
  const raw = loadJson('test/fixtures/bad-comp.json');
  const parsed = parseSchema(raw);
  assertTrue(parsed.errors.length > 0, 'Should have errors');
  assertTrue(parsed.errors.some(e => e.message.includes('Expected object')), 'Error should mention invalid schema');
});

// AC-6: contradictory types should produce warning (not error)
test('AC-6: contradictory types produce warning, not error', () => {
  const raw = loadJson('test/fixtures/contra.json');
  const parsed = parseSchema(raw);
  assertEqual(parsed.errors.length, 0, 'Should have no errors');
  assertEqual(parsed.warnings.length, 1, 'Should have 1 warning');
  assertTrue(parsed.warnings[0].message.includes('Contradictory'), 'Warning should mention contradictory types');
});

// AC-7: parsed schema has typed structure
test('AC-7: parsed schema has typed structure', () => {
  const raw = loadJson('test/fixtures/core.json');
  const parsed = parseSchema(raw);
  assertTrue(parsed.original.type === 'object', 'Should have type');
  assertTrue('properties' in parsed.original, 'Should have properties');
  assertTrue(parsed.original.properties && 'name' in parsed.original.properties, 'Should have name property');
  assertTrue(parsed.original.properties?.name?.type === 'string', 'Name should be string type');
});

// Additional tests for edge cases
test('Array of types is parsed correctly', () => {
  const raw = { type: ['string', 'null'] };
  const parsed = parseSchema(raw);
  assertEqual(parsed.errors.length, 0, 'Should have no errors');
  assertTrue(Array.isArray(parsed.original.type), 'Type should be array');
  assertEqual(parsed.original.type?.length, 2, 'Type array should have 2 elements');
});

test('additionalProperties boolean is valid', () => {
  const raw = { type: 'object', additionalProperties: false };
  const parsed = parseSchema(raw);
  assertEqual(parsed.errors.length, 0, 'Should have no errors');
  assertEqual(parsed.original.additionalProperties, false, 'additionalProperties should be false');
});

test('additionalProperties schema is parsed', () => {
  const raw = { type: 'object', additionalProperties: { type: 'string' } };
  const parsed = parseSchema(raw);
  assertEqual(parsed.errors.length, 0, 'Should have no errors');
  assertTrue(typeof parsed.original.additionalProperties === 'object', 'additionalProperties should be schema');
});

test('items is parsed recursively', () => {
  const raw = { type: 'array', items: { type: 'string' } };
  const parsed = parseSchema(raw);
  assertEqual(parsed.errors.length, 0, 'Should have no errors');
  assertTrue(parsed.original.items?.type === 'string', 'Items should have string type');
});

test('Invalid additionalProperties type produces error', () => {
  const raw = { type: 'object', additionalProperties: 'invalid' };
  const parsed = parseSchema(raw);
  assertTrue(parsed.errors.length > 0, 'Should have errors');
});

test('Path tracking works correctly', () => {
  const raw = {
    type: 'object',
    properties: {
      nested: {
        type: 'object',
        properties: {
          deep: { type: 'invalid' }
        }
      }
    }
  };
  const parsed = parseSchema(raw);
  assertTrue(parsed.errors.length > 0, 'Should have errors');
  assertTrue(parsed.errors[0].path.includes('deep'), 'Error path should include deep property');
});

console.log('\n=== Done ===\n');
