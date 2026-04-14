/**
 * Transliteration map for Latin-1 Supplement (U+00C0–U+00FF)
 */
const TRANSLITERATION: Record<string, string> = {
  // Uppercase vowels with accents
  '\u00C0': 'a', '\u00C1': 'a', '\u00C2': 'a', '\u00C3': 'a', '\u00C4': 'a', '\u00C5': 'a',
  '\u00C8': 'e', '\u00C9': 'e', '\u00CA': 'e', '\u00CB': 'e',
  '\u00CC': 'i', '\u00CD': 'i', '\u00CE': 'i', '\u00CF': 'i',
  '\u00D2': 'o', '\u00D3': 'o', '\u00D4': 'o', '\u00D5': 'o', '\u00D6': 'o',
  '\u00D9': 'u', '\u00DA': 'u', '\u00DB': 'u', '\u00DC': 'u',
  // Lowercase vowels with accents
  '\u00E0': 'a', '\u00E1': 'a', '\u00E2': 'a', '\u00E3': 'a', '\u00E4': 'a', '\u00E5': 'a',
  '\u00E8': 'e', '\u00E9': 'e', '\u00EA': 'e', '\u00EB': 'e',
  '\u00EC': 'i', '\u00ED': 'i', '\u00EE': 'i', '\u00EF': 'i',
  '\u00F2': 'o', '\u00F3': 'o', '\u00F4': 'o', '\u00F5': 'o', '\u00F6': 'o',
  '\u00F9': 'u', '\u00FA': 'u', '\u00FB': 'u', '\u00FC': 'u',
  // Special characters
  '\u00D1': 'n', '\u00F1': 'n', // Ñ, ñ
  '\u00C7': 'c', '\u00E7': 'c', // Ç, ç
  '\u00DF': 'ss', // ß
  '\u00C6': 'ae', '\u00E6': 'ae', // Æ, æ
  '\u0152': 'oe', '\u0153': 'oe', // Œ, œ (Latin Extended-A, but included)
  // Additional Latin-1 characters
  '\u00D0': 'd', '\u00F0': 'd', // Ð, ð
  '\u00D8': 'o', '\u00F8': 'o', // Ø, ø
  '\u00DE': 'th', '\u00FE': 'th', // Þ, þ
  '\u00D7': 'x', // ×
  '\u00F7': 'div', // ÷
  // Non-breaking space (becomes dash like regular space)
  '\u00A0': '-',
};

/**
 * Converts a string to a URL-safe slug.
 * 
 * @param input - The string to slugify
 * @returns A lowercase, dash-separated slug with transliterated Latin-1 characters
 */
export function slugify(input: string): string {
  // Handle non-string or empty input
  if (typeof input !== 'string' || input.length === 0) {
    return '';
  }

  // Phase 1: Char-by-char transformation
  let result = '';
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    
    // Check transliteration map first
    if (TRANSLITERATION[char] !== undefined) {
      result += TRANSLITERATION[char];
      continue;
    }
    
    // Lowercase ASCII letters
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) { // A-Z
      result += String.fromCharCode(code + 32); // Convert to lowercase
      continue;
    }
    
    // ASCII alphanumeric stays as-is (already lowercase letters and digits)
    if ((code >= 97 && code <= 122) || (code >= 48 && code <= 57)) {
      result += char;
      continue;
    }
    
    // Everything else becomes a dash (will be collapsed later)
    result += '-';
  }

  // Phase 2: Collapse consecutive dashes
  result = result.replace(/-+/g, '-');
  
  // Phase 3: Trim leading and trailing dashes
  result = result.replace(/^-+|-+$/g, '');
  
  return result;
}
