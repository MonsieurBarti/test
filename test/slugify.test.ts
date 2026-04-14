import { describe, it } from 'node:test';
import assert from 'node:assert';
import { slugify } from '../src/slugify.ts';

describe('slugify', () => {
  it('AC1: basic ASCII transformation', () => {
    assert.strictEqual(slugify('Hello World'), 'hello-world');
  });
});
