import { describe, it } from 'node:test';
import assert from 'node:assert';
import { slugify } from '../src/slugify.js';

describe('slugify', () => {
  it('AC1: converts "Hello World" to "hello-world"', () => {
    assert.strictEqual(slugify('Hello World'), 'hello-world');
  });

  it('AC2: transliterates Latin-1 Supplement chars - "Café" → "cafe"', () => {
    assert.strictEqual(slugify('Café'), 'cafe');
    // Additional transliteration checks
    assert.strictEqual(slugify('Naïve'), 'naive');
    assert.strictEqual(slugify('Zürich'), 'zurich');
    assert.strictEqual(slugify('Ñoño'), 'nono');
    assert.strictEqual(slugify('Ça va'), 'ca-va');
  });

  it('AC3: trims and collapses dashes - "  --test--  " → "test"', () => {
    assert.strictEqual(slugify('  --test--  '), 'test');
    assert.strictEqual(slugify('---hello---'), 'hello');
    assert.strictEqual(slugify('a   b'), 'a-b'); // spaces become dashes, then collapse
  });

  it('AC4: converts symbols to dashes and collapses - "Hello!!!World" → "hello-world"', () => {
    assert.strictEqual(slugify('Hello!!!World'), 'hello-world');
    assert.strictEqual(slugify('foo@bar.com'), 'foo-bar-com');
    assert.strictEqual(slugify('a$b#c'), 'a-b-c');
  });

  it('AC5: returns empty string for all-symbols input - "!!!" → ""', () => {
    assert.strictEqual(slugify('!!!'), '');
    assert.strictEqual(slugify('...'), '');
    assert.strictEqual(slugify('@@@'), '');
    assert.strictEqual(slugify('   '), ''); // whitespace only
  });

  it('AC6: returns empty string for empty input', () => {
    assert.strictEqual(slugify(''), '');
  });

  it('handles non-string inputs gracefully', () => {
    assert.strictEqual(slugify(undefined as any), '');
    assert.strictEqual(slugify(null as any), '');
    assert.strictEqual(slugify(123 as any), '');
  });

  it('AC7: processes 1KB string in under 1ms', () => {
    // Generate a 1KB string with mixed content
    const chunk = 'Hello World Café 123!!!';
    const input = chunk.repeat(Math.ceil(1024 / chunk.length)).slice(0, 1024);
    
    const start = performance.now();
    const result = slugify(input);
    const duration = performance.now() - start;
    
    assert.ok(result.length > 0, 'Should produce non-empty output');
    assert.ok(duration < 1, `Processing 1KB took ${duration}ms, expected < 1ms`);
  });

  it('AC8: handles all Latin-1 Supplement characters (U+00C0–U+00FF)', () => {
    // Test uppercase accented vowels (U+00C0–U+00D6, U+00D8–U+00DE)
    assert.strictEqual(slugify('ÀÁÂÃÄÅ'), 'aaaaaa');
    assert.strictEqual(slugify('ÈÉÊË'), 'eeee');
    assert.strictEqual(slugify('ÌÍÎÏ'), 'iiii');
    assert.strictEqual(slugify('ÒÓÔÕÖ'), 'ooooo');
    assert.strictEqual(slugify('ÙÚÛÜ'), 'uuuu');
    
    // Test lowercase accented vowels (U+00E0–U+00F6, U+00F8–U+00FE)
    assert.strictEqual(slugify('àáâãäå'), 'aaaaaa');
    assert.strictEqual(slugify('èéêë'), 'eeee');
    assert.strictEqual(slugify('ìíîï'), 'iiii');
    assert.strictEqual(slugify('òóôõö'), 'ooooo');
    assert.strictEqual(slugify('ùúûü'), 'uuuu');
    
    // Special characters
    assert.strictEqual(slugify('Ññ'), 'nn');
    assert.strictEqual(slugify('Çç'), 'cc');
    assert.strictEqual(slugify('ß'), 'ss');
    assert.strictEqual(slugify('Ææ'), 'aeae');
    
    // Additional Latin-1
    assert.strictEqual(slugify('Ðð'), 'dd');
    assert.strictEqual(slugify('Øø'), 'oo');
    assert.strictEqual(slugify('Þþ'), 'thth');
    
    // Non-breaking space (U+00A0)
    assert.strictEqual(slugify('hello\u00A0world'), 'hello-world');
    
    // Ensure all chars in range are processed (not undefined behavior)
    for (let code = 0xC0; code <= 0xFF; code++) {
      const char = String.fromCharCode(code);
      const result = slugify(char);
      // Should not throw or produce unexpected output
      assert.ok(typeof result === 'string', `Char U+${code.toString(16).toUpperCase()} produced valid output`);
    }
  });

  it('preserves digits in input', () => {
    assert.strictEqual(slugify('Version 2.0'), 'version-2-0');
    assert.strictEqual(slugify('123 Main St'), '123-main-st');
    assert.strictEqual(slugify('test123'), 'test123');
  });

  it('handles mixed case input', () => {
    assert.strictEqual(slugify('HELLO WORLD'), 'hello-world');
    assert.strictEqual(slugify('HeLLo WoRLd'), 'hello-world');
    assert.strictEqual(slugify('CAFÉ AU LAIT'), 'cafe-au-lait');
  });

  it('handles complex real-world examples', () => {
    assert.strictEqual(slugify('The Quick Brown Fox Jumps Over The Lazy Dog'), 'the-quick-brown-fox-jumps-over-the-lazy-dog');
    assert.strictEqual(slugify('My Blog Post #42!'), 'my-blog-post-42');
    assert.strictEqual(slugify('C++ Programming'), 'c-programming');
    assert.strictEqual(slugify('Node.js Tutorial'), 'node-js-tutorial');
    assert.strictEqual(slugify('User @mention'), 'user-mention');
    assert.strictEqual(slugify('Price: $99.99'), 'price-99-99');
  });
});
