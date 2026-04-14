import { describe, it } from 'node:test';
import assert from 'node:assert';
import { slugify } from '../src/slugify.ts';

describe('slugify', () => {
  it('AC1: basic ASCII transformation', () => {
    assert.strictEqual(slugify('Hello World'), 'hello-world');
  });

  it('AC2: Latin diacritic transliteration', () => {
    assert.strictEqual(slugify('café'), 'cafe');
    assert.strictEqual(slugify('naïve'), 'naive');
    assert.strictEqual(slugify('Müller'), 'muller');
  });

  it('AC3: symbol stripping', () => {
    assert.strictEqual(slugify('Hello! World? 123.'), 'hello-world-123');
  });

  it('AC4: hyphen normalization', () => {
    assert.strictEqual(slugify('  hello   world  '), 'hello-world');
  });

  it('AC5: non-Latin stripping', () => {
    assert.strictEqual(slugify('hello-你好-world'), 'hello-world');
  });

  it('AC6: empty result handling', () => {
    assert.strictEqual(slugify('你好世界'), '');
  });

  it('AC7: non-string input rejection', () => {
    assert.throws(() => slugify(null as unknown as string), {
      name: 'TypeError',
      message: 'Expected string, got object',
    });
    assert.throws(() => slugify(undefined as unknown as string), {
      name: 'TypeError',
      message: 'Expected string, got undefined',
    });
    assert.throws(() => slugify(123 as unknown as string), {
      name: 'TypeError',
      message: 'Expected string, got number',
    });
    assert.throws(() => slugify({} as unknown as string), {
      name: 'TypeError',
      message: 'Expected string, got object',
    });
    assert.throws(() => slugify([] as unknown as string), {
      name: 'TypeError',
      message: 'Expected string, got object',
    });
  });

  it('AC8: numbers preserved', () => {
    assert.strictEqual(slugify('Version 2.0'), 'version-20');
  });
});
