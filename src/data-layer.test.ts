/**
 * Test: TypeScript ESM project setup
 * This test verifies the project infrastructure is correctly configured.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Project Setup', () => {
  it('should have TypeScript ESM configuration', () => {
    // This test passes if TypeScript can compile and Node.js can run it as ESM
    assert.strictEqual(typeof import.meta, 'object');
    assert.ok(import.meta.url);
  });
});
