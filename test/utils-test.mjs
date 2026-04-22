#!/usr/bin/env node
import { setDifference, normalizeTypes } from '../dist/utils.js';

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
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

console.log('\n=== Utils Set Comparison Tests ===\n');

// Tests for setDifference
test('setDifference: finds added elements', () => {
  const a = new Set(['a', 'b']);
  const b = new Set(['a', 'b', 'c']);
  const result = setDifference(a, b);
  assertEqual(result.added, ['c'], 'Should find c as added');
  assertEqual(result.removed, [], 'Should have no removed');
});

test('setDifference: finds removed elements', () => {
  const a = new Set(['a', 'b', 'c']);
  const b = new Set(['a', 'b']);
  const result = setDifference(a, b);
  assertEqual(result.added, [], 'Should have no added');
  assertEqual(result.removed, ['c'], 'Should find c as removed');
});

test('setDifference: finds both added and removed', () => {
  const a = new Set(['a', 'b']);
  const b = new Set(['b', 'c']);
  const result = setDifference(a, b);
  assertEqual(result.added, ['c'], 'Should find c as added');
  assertEqual(result.removed, ['a'], 'Should find a as removed');
});

test('setDifference: empty sets', () => {
  const a = new Set();
  const b = new Set();
  const result = setDifference(a, b);
  assertEqual(result.added, [], 'Should have no added');
  assertEqual(result.removed, [], 'Should have no removed');
});

test('setDifference: identical sets', () => {
  const a = new Set(['a', 'b', 'c']);
  const b = new Set(['a', 'b', 'c']);
  const result = setDifference(a, b);
  assertEqual(result.added, [], 'Should have no added');
  assertEqual(result.removed, [], 'Should have no removed');
});

// Tests for normalizeTypes
test('normalizeTypes: handles single type string', () => {
  const result = normalizeTypes('string');
  assertTrue(result instanceof Set, 'Should return a Set');
  assertEqual([...result].sort(), ['string'], 'Should contain string');
});

test('normalizeTypes: handles type array', () => {
  const result = normalizeTypes(['string', 'null']);
  assertTrue(result instanceof Set, 'Should return a Set');
  assertEqual([...result].sort(), ['null', 'string'], 'Should contain both types');
});

test('normalizeTypes: handles undefined', () => {
  const result = normalizeTypes(undefined);
  assertTrue(result instanceof Set, 'Should return a Set');
  assertEqual([...result], [], 'Should be empty set');
});

test('normalizeTypes: handles all schema types', () => {
  const allTypes = ['string', 'number', 'integer', 'boolean', 'object', 'array', 'null'];
  const result = normalizeTypes(allTypes);
  assertEqual([...result].sort(), allTypes.sort(), 'Should contain all types');
});

test('normalizeTypes: deduplicates types in array', () => {
  const result = normalizeTypes(['string', 'string', 'null']);
  assertEqual([...result].sort(), ['null', 'string'], 'Should deduplicate');
});

console.log('\n=== Done ===\n');
