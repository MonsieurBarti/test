#!/usr/bin/env node
import { collectChanges } from '../dist/diff/collect.js';

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

function assertHasChange(changes, path, kind) {
  const found = changes.find(c => c.path === path && c.kind === kind);
  if (!found) {
    throw new Error(`Expected change at path "${path}" with kind "${kind}" not found. Changes: ${JSON.stringify(changes.map(c => ({ path: c.path, kind: c.kind })))}`);
  }
  return found;
}

function assertNoChange(changes, path, kind) {
  const found = changes.find(c => c.path === path && c.kind === kind);
  if (found) {
    throw new Error(`Unexpected change at path "${path}" with kind "${kind}" found.`);
  }
}

console.log('\n=== Diff Collect Phase Tests ===\n');

// Test: Identical schemas produce no changes
test('identical schemas produce no changes', () => {
  const oldSchema = { type: 'object', properties: { name: { type: 'string' } } };
  const newSchema = { type: 'object', properties: { name: { type: 'string' } } };
  const changes = collectChanges(oldSchema, newSchema);
  assertEqual(changes.length, 0, 'Should have no changes for identical schemas');
});

// Test: Property added
test('property added', () => {
  const oldSchema = { type: 'object', properties: {} };
  const newSchema = { type: 'object', properties: { email: { type: 'string' } } };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'properties.email', 'added');
});

// Test: Property removed
test('property removed', () => {
  const oldSchema = { type: 'object', properties: { username: { type: 'string' } } };
  const newSchema = { type: 'object', properties: {} };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'properties.username', 'removed');
});

// Test: Property changed (nested)
test('property type changed', () => {
  const oldSchema = { type: 'object', properties: { age: { type: 'integer' } } };
  const newSchema = { type: 'object', properties: { age: { type: 'string' } } };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'properties.age.type', 'changed');
});

// Test: Type changed at root
test('root type changed', () => {
  const oldSchema = { type: 'string' };
  const newSchema = { type: 'number' };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'type', 'changed');
});

// Test: Type narrowed (multi-type)
test('type narrowed from multi-type to single', () => {
  const oldSchema = { type: ['string', 'null'] };
  const newSchema = { type: 'string' };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'type', 'narrowed');
});

// Test: Type widened
test('type widened from single to multi-type', () => {
  const oldSchema = { type: 'string' };
  const newSchema = { type: ['string', 'null'] };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'type', 'changed');
});

// Test: Required added
test('required property added', () => {
  const oldSchema = { type: 'object', properties: { name: { type: 'string' } } };
  const newSchema = { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'required', 'changed');
});

// Test: Required removed
test('required property removed', () => {
  const oldSchema = { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] };
  const newSchema = { type: 'object', properties: { name: { type: 'string' } } };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'required', 'changed');
});

// Test: additionalProperties changed from true to false
test('additionalProperties changed from true to false', () => {
  const oldSchema = { type: 'object', additionalProperties: true };
  const newSchema = { type: 'object', additionalProperties: false };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'additionalProperties', 'changed');
});

// Test: additionalProperties changed from false to true
test('additionalProperties changed from false to true', () => {
  const oldSchema = { type: 'object', additionalProperties: false };
  const newSchema = { type: 'object', additionalProperties: true };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'additionalProperties', 'changed');
});

// Test: Items added
test('items added to array schema', () => {
  const oldSchema = { type: 'array' };
  const newSchema = { type: 'array', items: { type: 'string' } };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'items', 'added');
});

// Test: Items removed
test('items removed from array schema', () => {
  const oldSchema = { type: 'array', items: { type: 'string' } };
  const newSchema = { type: 'array' };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'items', 'removed');
});

// Test: Items type changed
test('items type changed', () => {
  const oldSchema = { type: 'array', items: { type: 'string' } };
  const newSchema = { type: 'array', items: { type: 'number' } };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'items.type', 'changed');
});

// Test: anyOf alternative added
test('anyOf alternative added', () => {
  const oldSchema = { anyOf: [{ type: 'string' }] };
  const newSchema = { anyOf: [{ type: 'string' }, { type: 'number' }] };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'anyOf[1]', 'added');
});

// Test: anyOf alternative removed
test('anyOf alternative removed', () => {
  const oldSchema = { anyOf: [{ type: 'string' }, { type: 'number' }] };
  const newSchema = { anyOf: [{ type: 'string' }] };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'anyOf[1]', 'removed');
});

// Test: oneOf alternative added
test('oneOf alternative added', () => {
  const oldSchema = { oneOf: [{ type: 'string' }] };
  const newSchema = { oneOf: [{ type: 'string' }, { type: 'number' }] };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'oneOf[1]', 'added');
});

// Test: oneOf alternative removed
test('oneOf alternative removed', () => {
  const oldSchema = { oneOf: [{ type: 'string' }, { type: 'number' }] };
  const newSchema = { oneOf: [{ type: 'string' }] };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'oneOf[1]', 'removed');
});

// Test: Nested property changes
test('nested property changes', () => {
  const oldSchema = {
    type: 'object',
    properties: {
      address: {
        type: 'object',
        properties: {
          city: { type: 'string' }
        }
      }
    }
  };
  const newSchema = {
    type: 'object',
    properties: {
      address: {
        type: 'object',
        properties: {
          city: { type: 'string' },
          zip: { type: 'string' }
        }
      }
    }
  };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'properties.address.properties.zip', 'added');
});

// Test: Multiple changes in one diff
test('multiple changes detected', () => {
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
      age: { type: 'string' },
      email: { type: 'string' }
    }
  };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'properties.age.type', 'changed');
  assertHasChange(changes, 'properties.email', 'added');
  assertEqual(changes.length, 2, 'Should have exactly 2 changes');
});

// Test: Type added where none existed
test('type added where none existed', () => {
  const oldSchema = {};
  const newSchema = { type: 'string' };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'type', 'added');
});

// Test: Type removed
test('type removed', () => {
  const oldSchema = { type: 'string' };
  const newSchema = {};
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'type', 'removed');
});

// Test: Empty schemas produce no changes
test('empty schemas produce no changes', () => {
  const oldSchema = {};
  const newSchema = {};
  const changes = collectChanges(oldSchema, newSchema);
  assertEqual(changes.length, 0, 'Should have no changes for empty schemas');
});

// Test: Breaking flag initialized to false
test('breaking flag initialized to false', () => {
  const oldSchema = { type: 'object', properties: { name: { type: 'string' } } };
  const newSchema = { type: 'object', properties: {} };
  const changes = collectChanges(oldSchema, newSchema);
  const change = assertHasChange(changes, 'properties.name', 'removed');
  assertEqual(change.breaking, false, 'Breaking should be false initially (set by annotate phase)');
});

// Test: additionalProperties schema added
test('additionalProperties schema added', () => {
  const oldSchema = { type: 'object', additionalProperties: true };
  const newSchema = { type: 'object', additionalProperties: { type: 'string' } };
  const changes = collectChanges(oldSchema, newSchema);
  // Should detect the change in additionalProperties
  assertTrue(changes.length > 0, 'Should detect change in additionalProperties');
});

// Test: additionalProperties schema changed
test('additionalProperties schema type changed', () => {
  const oldSchema = { type: 'object', additionalProperties: { type: 'string' } };
  const newSchema = { type: 'object', additionalProperties: { type: 'number' } };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'additionalProperties.type', 'changed');
});

// Test: Complex multi-type comparison
test('complex multi-type comparison', () => {
  const oldSchema = { type: ['string', 'number', 'null'] };
  const newSchema = { type: ['string', 'null'] };
  const changes = collectChanges(oldSchema, newSchema);
  assertHasChange(changes, 'type', 'narrowed');
});

// Test: Type order doesn't matter
test('type order does not affect comparison', () => {
  const oldSchema = { type: ['null', 'string'] };
  const newSchema = { type: ['string', 'null'] };
  const changes = collectChanges(oldSchema, newSchema);
  assertEqual(changes.length, 0, 'Should have no changes when types are the same in different order');
});

console.log('\n=== Done ===\n');
