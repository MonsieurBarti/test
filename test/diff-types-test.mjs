#!/usr/bin/env node
import { 
  ChangeKind,
  createChange,
  isChange,
  isBreaking,
  isAddition,
  isRemoval,
  isModification,
  isNarrowing
} from '../dist/diff/types.js';

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

console.log('\n=== Diff Types Tests ===\n');

// Test ChangeKind type is exported (runtime check via values)
test('ChangeKind has all expected values', () => {
  assertEqual(ChangeKind.Added, 'added', 'Added kind should be "added"');
  assertEqual(ChangeKind.Removed, 'removed', 'Removed kind should be "removed"');
  assertEqual(ChangeKind.Changed, 'changed', 'Changed kind should be "changed"');
  assertEqual(ChangeKind.Narrowed, 'narrowed', 'Narrowed kind should be "narrowed"');
});

// Test createChange factory
test('createChange creates added change', () => {
  const change = createChange('properties.email', 'added', undefined, { type: 'string' });
  assertEqual(change.path, 'properties.email', 'Path should match');
  assertEqual(change.kind, 'added', 'Kind should be added');
  assertEqual(change.oldValue, undefined, 'Old value should be undefined');
  assertTrue(change.newValue?.type === 'string', 'New value should have type string');
  assertEqual(change.breaking, false, 'Added change should not be breaking initially');
});

test('createChange creates removed change', () => {
  const change = createChange('properties.username', 'removed', { type: 'string' }, undefined);
  assertEqual(change.path, 'properties.username', 'Path should match');
  assertEqual(change.kind, 'removed', 'Kind should be removed');
  assertTrue(change.oldValue?.type === 'string', 'Old value should have type string');
  assertEqual(change.newValue, undefined, 'New value should be undefined');
  assertEqual(change.breaking, false, 'Breaking should be false initially (set by annotate phase)');
});

test('createChange creates changed change', () => {
  const change = createChange('type', 'changed', 'string', 'number');
  assertEqual(change.path, 'type', 'Path should match');
  assertEqual(change.kind, 'changed', 'Kind should be changed');
  assertEqual(change.oldValue, 'string', 'Old value should be string');
  assertEqual(change.newValue, 'number', 'New value should be number');
  assertEqual(change.breaking, false, 'Breaking should be false initially');
});

test('createChange creates narrowed change', () => {
  const change = createChange('type', 'narrowed', ['string', 'number'], ['string']);
  assertEqual(change.path, 'type', 'Path should match');
  assertEqual(change.kind, 'narrowed', 'Kind should be narrowed');
  assertTrue(Array.isArray(change.oldValue), 'Old value should be array');
  assertTrue(Array.isArray(change.newValue), 'New value should be array');
  assertEqual(change.breaking, false, 'Breaking should be false initially');
});

// Test isChange type guard
test('isChange validates change objects', () => {
  const validChange = { path: 'test', kind: 'added', breaking: false };
  const invalidChange = { path: 'test' };
  
  assertTrue(isChange(validChange), 'Should recognize valid change');
  assertEqual(isChange(invalidChange), false, 'Should reject invalid change');
  assertEqual(isChange(null), false, 'Should reject null');
  assertEqual(isChange(undefined), false, 'Should reject undefined');
  assertEqual(isChange('string'), false, 'Should reject non-object');
});

// Test breaking status helper
test('isBreaking checks breaking flag', () => {
  const breaking = { path: 'test', kind: 'removed', breaking: true };
  const nonBreaking = { path: 'test', kind: 'added', breaking: false };
  
  assertTrue(isBreaking(breaking), 'Removed should be breaking');
  assertEqual(isBreaking(nonBreaking), false, 'Added should not be breaking');
});

// Test kind helper functions
test('isAddition checks for added kind', () => {
  const added = { path: 'test', kind: 'added', breaking: false };
  const removed = { path: 'test', kind: 'removed', breaking: true };
  
  assertTrue(isAddition(added), 'Should recognize addition');
  assertEqual(isAddition(removed), false, 'Should not confuse with removal');
});

test('isRemoval checks for removed kind', () => {
  const removed = { path: 'test', kind: 'removed', breaking: true };
  const changed = { path: 'test', kind: 'changed', breaking: true };
  
  assertTrue(isRemoval(removed), 'Should recognize removal');
  assertEqual(isRemoval(changed), false, 'Should not confuse with change');
});

test('isModification checks for changed kind', () => {
  const changed = { path: 'test', kind: 'changed', breaking: true };
  const narrowed = { path: 'test', kind: 'narrowed', breaking: true };
  
  assertTrue(isModification(changed), 'Should recognize modification');
  assertEqual(isModification(narrowed), false, 'Should not confuse with narrowing');
});

test('isNarrowing checks for narrowed kind', () => {
  const narrowed = { path: 'test', kind: 'narrowed', breaking: true };
  const added = { path: 'test', kind: 'added', breaking: false };
  
  assertTrue(isNarrowing(narrowed), 'Should recognize narrowing');
  assertEqual(isNarrowing(added), false, 'Should not confuse with addition');
});

console.log('\n=== Done ===\n');
