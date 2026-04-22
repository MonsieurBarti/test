#!/usr/bin/env node
import { formatChanges } from '../dist/diff/format.js';
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
  if (actual !== expected) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

console.log('\n=== Diff Format Phase Tests ===\n');

// Test: Empty changes array returns empty string
test('empty changes array returns empty string', () => {
  const output = formatChanges([]);
  assertEqual(output, '', 'Should return empty string for empty input');
});

// Test: Single added change
test('formats single added change', () => {
  const change = createChange('properties.email', 'added', undefined, { type: 'string' });
  change.breaking = false;
  
  const output = formatChanges([change]);
  assertEqual(output, '+ properties.email', 'Should format added change with + prefix');
});

// Test: Single removed change (breaking)
test('formats single removed change as breaking', () => {
  const change = createChange('properties.username', 'removed', { type: 'string' }, undefined);
  change.breaking = true;
  
  const output = formatChanges([change]);
  assertEqual(output, '! - properties.username', 'Should format removed change with ! - prefix');
});

// Test: Single changed change (breaking)
test('formats type change as breaking', () => {
  const change = createChange('type', 'changed', 'string', 'number');
  change.breaking = true;
  
  const output = formatChanges([change]);
  assertEqual(output, '! ~ type: string → number', 'Should format changed type with ! ~ prefix and arrow');
});

// Test: Single narrowed change (breaking)
test('formats narrowed type as breaking', () => {
  const change = createChange('type', 'narrowed', ['string', 'null'], 'string');
  change.breaking = true;
  
  const output = formatChanges([change]);
  assertEqual(output, '! < type: string | null → string', 'Should format narrowed type with ! < prefix');
});

// Test: Multiple changes - breaking first, then non-breaking
test('groups breaking changes before non-breaking', () => {
  const changes = [
    { ...createChange('properties.email', 'added', undefined, { type: 'string' }), breaking: false },
    { ...createChange('properties.username', 'removed', { type: 'string' }, undefined), breaking: true },
    { ...createChange('type', 'changed', 'string', 'number'), breaking: true },
  ];
  
  const output = formatChanges(changes);
  const lines = output.split('\n');
  
  assertEqual(lines.length, 3, 'Should have 3 lines');
  assertEqual(lines[0], '! - properties.username', 'First line should be breaking (removed)');
  assertEqual(lines[1], '! ~ type: string → number', 'Second line should be breaking (changed)');
  assertEqual(lines[2], '+ properties.email', 'Third line should be non-breaking (added)');
});

// Test: Alphabetical sorting within breaking group
test('sorts breaking changes alphabetically by path', () => {
  const changes = [
    { ...createChange('type', 'changed', 'string', 'number'), breaking: true },
    { ...createChange('properties.username', 'removed', { type: 'string' }, undefined), breaking: true },
    { ...createChange('anyOf[1]', 'removed', { type: 'number' }, undefined), breaking: true },
  ];
  
  const output = formatChanges(changes);
  const lines = output.split('\n');
  
  assertEqual(lines[0], '! - anyOf[1]', 'First should be anyOf[1] (alphabetically first)');
  assertEqual(lines[1], '! - properties.username', 'Second should be properties.username');
  assertEqual(lines[2], '! ~ type: string → number', 'Third should be type');
});

// Test: Alphabetical sorting within non-breaking group
test('sorts non-breaking changes alphabetically by path', () => {
  const changes = [
    { ...createChange('properties.email', 'added', undefined, { type: 'string' }), breaking: false },
    { ...createChange('anyOf[1]', 'added', undefined, { type: 'number' }), breaking: false },
    { ...createChange('properties.age', 'added', undefined, { type: 'integer' }), breaking: false },
  ];
  
  const output = formatChanges(changes);
  const lines = output.split('\n');
  
  assertEqual(lines[0], '+ anyOf[1]', 'First should be anyOf[1]');
  assertEqual(lines[1], '+ properties.age', 'Second should be properties.age');
  assertEqual(lines[2], '+ properties.email', 'Third should be properties.email');
});

// Test: Mixed changes with proper grouping and sorting
test('formats mixed changes with breaking first, then sorted', () => {
  const changes = [
    { ...createChange('properties.email', 'added', undefined, { type: 'string' }), breaking: false },
    { ...createChange('properties.username', 'removed', { type: 'string' }, undefined), breaking: true },
    { ...createChange('anyOf[1]', 'added', undefined, { type: 'number' }), breaking: false },
    { ...createChange('type', 'changed', 'string', 'number'), breaking: true },
    { ...createChange('properties.age', 'added', undefined, { type: 'integer' }), breaking: false },
  ];
  
  const output = formatChanges(changes);
  const lines = output.split('\n');
  
  // Breaking changes first (sorted alphabetically)
  assertEqual(lines[0], '! - properties.username', 'First breaking: properties.username');
  assertEqual(lines[1], '! ~ type: string → number', 'Second breaking: type');
  
  // Non-breaking changes (sorted alphabetically)
  assertEqual(lines[2], '+ anyOf[1]', 'First non-breaking: anyOf[1]');
  assertEqual(lines[3], '+ properties.age', 'Second non-breaking: properties.age');
  assertEqual(lines[4], '+ properties.email', 'Third non-breaking: properties.email');
});

// Test: Required property added (breaking)
test('formats required property added as breaking', () => {
  const change = createChange('required', 'changed', [], ['name']);
  change.breaking = true;
  
  const output = formatChanges([change]);
  assertEqual(output, '! ~ required: [] → ["name"]', 'Should format required change with values');
});

// Test: Type widening (non-breaking)
test('formats type widening as non-breaking', () => {
  const change = createChange('type', 'changed', 'string', ['string', 'number']);
  change.breaking = false;
  
  const output = formatChanges([change]);
  assertEqual(output, '~ type: string → string | number', 'Should format type widening without !');
});

// Test: AnyOf alternative removed (breaking)
test('formats anyOf alternative removed as breaking', () => {
  const change = createChange('anyOf[1]', 'removed', { type: 'number' }, undefined);
  change.breaking = true;
  
  const output = formatChanges([change]);
  assertEqual(output, '! - anyOf[1]', 'Should format anyOf removal with ! -');
});

// Test: OneOf alternative added (non-breaking)
test('formats oneOf alternative added as non-breaking', () => {
  const change = createChange('oneOf[1]', 'added', undefined, { type: 'number' });
  change.breaking = false;
  
  const output = formatChanges([change]);
  assertEqual(output, '+ oneOf[1]', 'Should format oneOf addition with +');
});

// Test: Nested property change
test('formats nested property change', () => {
  const change = createChange('properties.age.type', 'changed', 'integer', 'string');
  change.breaking = true;
  
  const output = formatChanges([change]);
  assertEqual(output, '! ~ properties.age.type: integer → string', 'Should format nested property change');
});

// Test: Items type change
test('formats items type change', () => {
  const change = createChange('items.type', 'changed', 'string', 'number');
  change.breaking = true;
  
  const output = formatChanges([change]);
  assertEqual(output, '! ~ items.type: string → number', 'Should format items type change');
});

// Test: Multi-type array formatting
test('formats multi-type arrays with pipe separator', () => {
  const change = createChange('type', 'narrowed', ['string', 'number', 'null'], ['string']);
  change.breaking = true;
  
  const output = formatChanges([change]);
  assertEqual(output, '! < type: string | number | null → string', 'Should format multi-type with pipes');
});

// Test: Complex scenario with all change types (sorted alphabetically as per AC-9)
test('formats all change types correctly', () => {
  const changes = [
    { ...createChange('properties.email', 'added', undefined, { type: 'string' }), breaking: false },
    { ...createChange('properties.username', 'removed', { type: 'string' }, undefined), breaking: true },
    { ...createChange('properties.age.type', 'changed', 'integer', 'string'), breaking: true },
    { ...createChange('type', 'narrowed', ['string', 'null'], 'string'), breaking: true },
    { ...createChange('anyOf[1]', 'added', undefined, { type: 'number' }), breaking: false },
  ];
  
  const output = formatChanges(changes);
  const lines = output.split('\n');
  
  // Breaking first (sorted alphabetically by path)
  // properties.age.type < properties.username < type (alphabetically)
  assertEqual(lines[0], '! ~ properties.age.type: integer → string', 'First breaking: properties.age.type');
  assertEqual(lines[1], '! - properties.username', 'Second breaking: properties.username');
  assertEqual(lines[2], '! < type: string | null → string', 'Third breaking: type');
  
  // Non-breaking (sorted alphabetically by path)
  // anyOf[1] < properties.email (alphabetically)
  assertEqual(lines[3], '+ anyOf[1]', 'First non-breaking: anyOf[1]');
  assertEqual(lines[4], '+ properties.email', 'Second non-breaking: properties.email');
});

console.log('\n=== Done ===\n');
