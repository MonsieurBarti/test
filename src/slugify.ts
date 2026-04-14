import { transliterate } from './transliterate.ts';

/**
 * Transform a string into a URL-safe slug.
 * 
 * Pipeline stages:
 * 1. Transliterate — Convert Latin diacritics to ASCII
 * 2. Lowercase — Normalize to lowercase
 * 3. Hyphenate — Replace spaces with hyphens
 * 4. Strip — Remove non-alphanumeric except hyphens
 * 5. Collapse — Merge consecutive hyphens, trim edges
 */
export function slugify(str: string): string {
  // Input validation
  if (typeof str !== 'string') {
    throw new TypeError(`Expected string, got ${typeof str}`);
  }

  // Stage 1: Transliterate Latin diacritics
  let result = transliterate(str);

  // Stage 2: Lowercase
  result = result.toLowerCase();

  // Stage 3: Hyphenate (spaces → hyphens)
  result = result.replace(/\s+/g, '-');

  // Stage 4: Strip non-alphanumeric except hyphens
  result = result.replace(/[^a-z0-9-]/g, '');

  // Stage 5: Collapse consecutive hyphens, trim edges
  result = result.replace(/-+/g, '-');
  result = result.replace(/^-+|-+$/g, '');

  return result;
}
