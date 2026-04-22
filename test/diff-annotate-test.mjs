#!/usr/bin/env node
import { annotateChanges } from '../dist/diff/annotate.js';
import { createChange } from '../dist/diff/types.js';

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

console.log('\n=== Diff Annotate Phase Tests ===\n');

// Test: Empty changes array returns empty array
test('empty changes array returns empty array', () => {
  const changes = annotateChanges([]);
  assertEqual(changes.length, 0, 'Should return empty array for empty input');
});

// Test: Removed change is always breaking
test('removed change is always breaking', () => {
  const changes = annotateChanges([
    createChange('properties.username', 'removed', { type: 'string' }, undefined)
  ]);
  assertTrue(changes[0].breaking, 'Removed change should be marked as breaking');
});

// Test: Removed anyOf alternative is breaking
test('removed anyOf alternative is breaking', () => {
  const changes = annotateChanges([
    createChange('anyOf[1]', 'removed', { type: 'number' }, undefined)
  ]);
  assertTrue(changes[0].breaking, 'Removed anyOf alternative should be breaking');
});

// Test: Removed oneOf alternative is breaking
test('removed oneOf alternative is breaking', () => {
  const changes = annotateChanges([
    createChange('oneOf[1]', 'removed', { type: 'number' }, undefined)
  ]);
  assertTrue(changes[0].breaking, 'Removed oneOf alternative should be breaking');
});

// Test: Narrowed change is always breaking
test('narrowed type change is breaking', () => {
  const changes = annotateChanges([
    createChange('type', 'narrowed', ['string', 'null'], 'string')
  ]);
  assertTrue(changes[0].breaking, 'Narrowed type should be breaking');
});

// Test: Type change from string to number is breaking
test('type changed from string to number is breaking', () => {
  const changes = annotateChanges([
    createChange('type', 'changed', 'string', 'number')
  ]);
  assertTrue(changes[0].breaking, 'Type change from string to number should be breaking');
});

// Test: Type change from string to string|number is non-breaking (widened)
test('type widened from string to string|number is non-breaking', () => {
  const changes = annotateChanges([
    createChange('type', 'changed', 'string', ['string', 'number'])
  ]);
  assertEqual(changes[0].breaking, false, 'Widened type should not be breaking');
});

// Test: Type change from string|number to string|number|null is non-breaking (widened)
test('type widened from string|number to add null is non-breaking', () => {
  const changes = annotateChanges([
    createChange('type', 'changed', ['string', 'number'], ['string', 'number', 'null'])
  ]);
  assertEqual(changes[0].breaking, false, 'Adding null to type union should not be breaking');
});

// Test: Property added is non-breaking
test('property added is non-breaking', () => {
  const changes = annotateChanges([
    createChange('properties.email', 'added', undefined, { type: 'string' })
  ]);
  assertEqual(changes[0].breaking, false, 'Added property should not be breaking');
});

// Test: additionalProperties true to false is breaking
test('additionalProperties true to false is breaking', () => {
  const changes = annotateChanges([
    createChange('additionalProperties', 'changed', true, false)
  ]);
  assertTrue(changes[0].breaking, 'additionalProperties true to false should be breaking');
});

// Test: additionalProperties false to true is non-breaking
test('additionalProperties false to true is non-breaking', () => {
  const changes = annotateChanges([
    createChange('additionalProperties', 'changed', false, true)
  ]);
  assertEqual(changes[0].breaking, false, 'additionalProperties false to true should not be breaking');
});

// Test: Required property added is breaking
test('required property added is breaking', () => {
  const changes = annotateChanges([
    createChange('required', 'changed', [], ['name'])
  ]);
  assertTrue(changes[0].breaking, 'Adding required constraint should be breaking');
});

// Test: Required property removed is non-breaking
test('required property removed is non-breaking', () => {
  const changes = annotateChanges([
    createChange('required', 'changed', ['name'], [])
  ]);
  assertEqual(changes[0].breaking, false, 'Removing required constraint should not be breaking');
});

// Test: Multiple required properties added is breaking
test('multiple required properties added is breaking', () => {
  const changes = annotateChanges([
    createChange('required', 'changed', ['name'], ['name', 'email', 'age'])
  ]);
  assertTrue(changes[0].breaking, 'Adding required properties should be breaking');
});

// Test: Multiple required properties removed is non-breaking
test('multiple required properties removed is non-breaking', () => {
  const changes = annotateChanges([
    createChange('required', 'changed', ['name', 'email', 'age'], ['name'])
  ]);
  assertEqual(changes[0].breaking, false, 'Removing required properties should not be breaking');
});

// Test: Items added is breaking (constraint added)
test('items added to array is breaking', () => {
  const changes = annotateChanges([
    createChange('items', 'added', undefined, { type: 'string' })
  ]);
  // Adding items constraint is actually narrowing the schema
  assertTrue(changes[0].breaking, 'Adding items constraint should be breaking');
});

// Test: Items removed is breaking
test('items removed from array is breaking', () => {
  const changes = annotateChanges([
    createChange('items', 'removed', { type: 'string' }, undefined)
  ]);
  assertTrue(changes[0].breaking, 'Removing items constraint should be breaking');
});

// Test: AnyOf alternative added is non-breaking
test('anyOf alternative added is non-breaking', () => {
  const changes = annotateChanges([
    createChange('anyOf[1]', 'added', undefined, { type: 'number' })
  ]);
  assertEqual(changes[0].breaking, false, 'Adding anyOf alternative should not be breaking');
});

// Test: OneOf alternative added is non-breaking
test('oneOf alternative added is non-breaking', () => {
  const changes = annotateChanges([
    createChange('oneOf[1]', 'added', undefined, { type: 'number' })
  ]);
  assertEqual(changes[0].breaking, false, 'Adding oneOf alternative should not be breaking');
});

// Test: Mixed changes with some breaking
test('mixed changes with some breaking and some non-breaking', () => {
  const changes = annotateChanges([
    createChange('properties.email', 'added', undefined, { type: 'string' }),
    createChange('properties.username', 'removed', { type: 'string' }, undefined),
    createChange('type', 'changed', 'string', ['string', 'number'])
  ]);
  
  assertEqual(changes[0].breaking, false, 'Added property should not be breaking');
  assertTrue(changes[1].breaking, 'Removed property should be breaking');
  assertEqual(changes[2].breaking, false, 'Widened type should not be breaking');
});

// Test: Type added is non-breaking
test('type added is non-breaking', () => {
  const changes = annotateChanges([
    createChange('type', 'added', undefined, 'string')
  ]);
  assertEqual(changes[0].breaking, false, 'Adding type should not be breaking');
});

// Test: Type removed is breaking
test('type removed is breaking', () => {
  const changes = annotateChanges([
    createChange('type', 'removed', 'string', undefined)
  ]);
  assertTrue(changes[0].breaking, 'Removing type should be breaking');
});

// Test: additionalProperties added (schema) is breaking
test('additionalProperties schema added is breaking', () => {
  const changes = annotateChanges([
    createChange('additionalProperties', 'added', undefined, { type: 'string' })
  ]);
  assertTrue(changes[0].breaking, 'Adding additionalProperties schema should be breaking');
});

// Test: additionalProperties removed is non-breaking
test('additionalProperties removed is non-breaking', () => {
  const changes = annotateChanges([
    createChange('additionalProperties', 'removed', { type: 'string' }, undefined)
  ]);
  // Removing a schema constraint is widening = non-breaking
  assertEqual(changes[0].breaking, false, 'Removing additionalProperties schema should not be breaking');
});

// Test: Nested type change is breaking
test('nested property type changed is breaking', () => {
  const changes = annotateChanges([
    createChange('properties.age.type', 'changed', 'integer', 'string')
  ]);
  assertTrue(changes[0].breaking, 'Nested type change should be breaking');
});

// Test: Items type change is breaking
test('items type change is breaking', () => {
  const changes = annotateChanges([
    createChange('items.type', 'changed', 'string', 'number')
  ]);
  assertTrue(changes[0].breaking, 'Items type change should be breaking');
});

console.log('\n=== Done ===\n');
