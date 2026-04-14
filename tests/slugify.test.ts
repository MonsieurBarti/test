import { describe, it } from 'node:test';
import assert from 'node:assert';
import { slugify } from '../src/slugify.js';

describe('slugify', () => {
  it('AC1: converts "Hello World" to "hello-world"', () => {
    assert.strictEqual(slugify('Hello World'), 'hello-world');
  });
});
