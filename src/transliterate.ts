/**
 * Latin diacritics transliteration map
 * Covers Latin-1 Supplement (U+00C0-U+00FF), Latin Extended-A (U+0100-U+017F),
 * and select Latin Extended-B characters.
 */

export const TRANSLITERATION_MAP: Record<string, string> = {
  // Latin-1 Supplement (U+00C0-U+00FF)
  // À-ÿ excluding × and ÷
  '\u00C0': 'A', '\u00C1': 'A', '\u00C2': 'A', '\u00C3': 'A', '\u00C4': 'A', '\u00C5': 'A',
  '\u00C6': 'AE',
  '\u00C7': 'C',
  '\u00C8': 'E', '\u00C9': 'E', '\u00CA': 'E', '\u00CB': 'E',
  '\u00CC': 'I', '\u00CD': 'I', '\u00CE': 'I', '\u00CF': 'I',
  '\u00D0': 'D',
  '\u00D1': 'N',
  '\u00D2': 'O', '\u00D3': 'O', '\u00D4': 'O', '\u00D5': 'O', '\u00D6': 'O',
  '\u00D8': 'O',
  '\u00D9': 'U', '\u00DA': 'U', '\u00DB': 'U', '\u00DC': 'U',
  '\u00DD': 'Y',
  '\u00DE': 'TH',
  '\u00DF': 'ss',

  '\u00E0': 'a', '\u00E1': 'a', '\u00E2': 'a', '\u00E3': 'a', '\u00E4': 'a', '\u00E5': 'a',
  '\u00E6': 'ae',
  '\u00E7': 'c',
  '\u00E8': 'e', '\u00E9': 'e', '\u00EA': 'e', '\u00EB': 'e',
  '\u00EC': 'i', '\u00ED': 'i', '\u00EE': 'i', '\u00EF': 'i',
  '\u00F0': 'd',
  '\u00F1': 'n',
  '\u00F2': 'o', '\u00F3': 'o', '\u00F4': 'o', '\u00F5': 'o', '\u00F6': 'o',
  '\u00F8': 'o',
  '\u00F9': 'u', '\u00FA': 'u', '\u00FB': 'u', '\u00FC': 'u',
  '\u00FD': 'y',
  '\u00FE': 'th',
  '\u00FF': 'y',

  // Latin Extended-A (U+0100-U+017F)
  '\u0100': 'A', '\u0101': 'a', // macron
  '\u0102': 'A', '\u0103': 'a', // breve
  '\u0104': 'A', '\u0105': 'a', // ogonek
  '\u0106': 'C', '\u0107': 'c', // acute
  '\u0108': 'C', '\u0109': 'c', // circumflex
  '\u010A': 'C', '\u010B': 'c', // dot above
  '\u010C': 'C', '\u010D': 'c', // caron
  '\u010E': 'D', '\u010F': 'd', // caron
  '\u0110': 'D', '\u0111': 'd', // stroke
  '\u0112': 'E', '\u0113': 'e', // macron
  '\u0114': 'E', '\u0115': 'e', // breve
  '\u0116': 'E', '\u0117': 'e', // dot above
  '\u0118': 'E', '\u0119': 'e', // ogonek
  '\u011A': 'E', '\u011B': 'e', // caron
  '\u011C': 'G', '\u011D': 'g', // circumflex
  '\u011E': 'G', '\u011F': 'g', // breve
  '\u0120': 'G', '\u0121': 'g', // dot above
  '\u0122': 'G', '\u0123': 'g', // cedilla
  '\u0124': 'H', '\u0125': 'h', // circumflex
  '\u0126': 'H', '\u0127': 'h', // stroke
  '\u0128': 'I', '\u0129': 'i', // tilde
  '\u012A': 'I', '\u012B': 'i', // macron
  '\u012C': 'I', '\u012D': 'i', // breve
  '\u012E': 'I', '\u012F': 'i', // ogonek
  '\u0130': 'I', '\u0131': 'i', // dot above / dotless
  '\u0132': 'IJ', '\u0133': 'ij',
  '\u0134': 'J', '\u0135': 'j', // circumflex
  '\u0136': 'K', '\u0137': 'k', // cedilla
  '\u0138': 'k', // kra
  '\u0139': 'L', '\u013A': 'l', // acute
  '\u013B': 'L', '\u013C': 'l', // cedilla
  '\u013D': 'L', '\u013E': 'l', // caron
  '\u013F': 'L', '\u0140': 'l', // middle dot
  '\u0141': 'L', '\u0142': 'l', // stroke
  '\u0143': 'N', '\u0144': 'n', // acute
  '\u0145': 'N', '\u0146': 'n', // cedilla
  '\u0147': 'N', '\u0148': 'n', // caron
  '\u0149': 'n', // apostrophe
  '\u014A': 'NG', '\u014B': 'ng',
  '\u014C': 'O', '\u014D': 'o', // macron
  '\u014E': 'O', '\u014F': 'o', // breve
  '\u0150': 'O', '\u0151': 'o', // double acute
  '\u0152': 'OE', '\u0153': 'oe',
  '\u0154': 'R', '\u0155': 'r', // acute
  '\u0156': 'R', '\u0157': 'r', // cedilla
  '\u0158': 'R', '\u0159': 'r', // caron
  '\u015A': 'S', '\u015B': 's', // acute
  '\u015C': 'S', '\u015D': 's', // circumflex
  '\u015E': 'S', '\u015F': 's', // cedilla
  '\u0160': 'S', '\u0161': 's', // caron
  '\u0162': 'T', '\u0163': 't', // cedilla
  '\u0164': 'T', '\u0165': 't', // caron
  '\u0166': 'T', '\u0167': 't', // stroke
  '\u0168': 'U', '\u0169': 'u', // tilde
  '\u016A': 'U', '\u016B': 'u', // macron
  '\u016C': 'U', '\u016D': 'u', // breve
  '\u016E': 'U', '\u016F': 'u', // ring above
  '\u0170': 'U', '\u0171': 'u', // double acute
  '\u0172': 'U', '\u0173': 'u', // ogonek
  '\u0174': 'W', '\u0175': 'w', // circumflex
  '\u0176': 'Y', '\u0177': 'y', // circumflex
  '\u0178': 'Y', // diaeresis
  '\u0179': 'Z', '\u017A': 'z', // acute
  '\u017B': 'Z', '\u017C': 'z', // dot above
  '\u017D': 'Z', '\u017E': 'z', // caron
  '\u017F': 's', // long s

  // Latin Extended-B select
  '\u0180': 'b', '\u0181': 'B', '\u0182': 'B', '\u0183': 'b',
  '\u0184': 'B', '\u0185': 'b', '\u0186': 'O', '\u0187': 'C',
  '\u0188': 'c', '\u0189': 'D', '\u018A': 'D', '\u018B': 'D',
  '\u018C': 'd', '\u018D': 'd', '\u018E': 'E', '\u018F': 'E',
  '\u0190': 'E', '\u0191': 'F', '\u0192': 'f', '\u0193': 'G',
  '\u0194': 'G', '\u0195': 'hv', '\u0196': 'I', '\u0197': 'I',
  '\u0198': 'K', '\u0199': 'k', '\u019A': 'l', '\u019B': 'l',
  '\u019C': 'M', '\u019D': 'N', '\u019E': 'n', '\u019F': 'O',
  '\u01A0': 'O', '\u01A1': 'o', '\u01A2': 'OI', '\u01A3': 'oi',
  '\u01A4': 'P', '\u01A5': 'p', '\u01A6': 'YR', '\u01A7': 'S',
  '\u01A8': 's', '\u01A9': 'S', '\u01AA': 'Esh', '\u01AB': 't',
  '\u01AC': 'T', '\u01AD': 't', '\u01AE': 'T', '\u01AF': 'U',
  '\u01B0': 'u', '\u01B1': 'U', '\u01B2': 'V', '\u01B3': 'Y',
  '\u01B4': 'y', '\u01B5': 'Z', '\u01B6': 'z', '\u01B7': 'Ezh',
  '\u01B8': 'Ezh', '\u01B9': 'ezh', '\u01BA': 'ezh', '\u01BB': 't',
  '\u01BC': 'T', '\u01BD': 't', '\u01BE': 't', '\u01BF': 'w',
  '\u01C0': '||', '\u01C1': '||', '\u01C2': '||', '\u01C3': '!',
  '\u01C4': 'DZ', '\u01C5': 'Dz', '\u01C6': 'dz',
  '\u01C7': 'LJ', '\u01C8': 'Lj', '\u01C9': 'lj',
  '\u01CA': 'NJ', '\u01CB': 'Nj', '\u01CC': 'nj',
  '\u01CD': 'A', '\u01CE': 'a', '\u01CF': 'I', '\u01D0': 'i',
  '\u01D1': 'O', '\u01D2': 'o', '\u01D3': 'U', '\u01D4': 'u',
  '\u01D5': 'U', '\u01D6': 'u', '\u01D7': 'U', '\u01D8': 'u',
  '\u01D9': 'U', '\u01DA': 'u', '\u01DB': 'U', '\u01DC': 'u',
  '\u01DD': 'e', '\u01DE': 'A', '\u01DF': 'a', '\u01E0': 'A',
  '\u01E1': 'a', '\u01E2': 'AE', '\u01E3': 'ae', '\u01E4': 'G',
  '\u01E5': 'g', '\u01E6': 'G', '\u01E7': 'g', '\u01E8': 'K',
  '\u01E9': 'k', '\u01EA': 'O', '\u01EB': 'o', '\u01EC': 'O',
  '\u01ED': 'o', '\u01EE': 'Ezh', '\u01EF': 'ezh', '\u01F0': 'j',
  '\u01F1': 'DZ', '\u01F2': 'Dz', '\u01F3': 'dz',
  '\u01F4': 'G', '\u01F5': 'g', '\u01F6': 'H', '\u01F7': 'h',
  '\u01F8': 'N', '\u01F9': 'n', '\u01FA': 'A', '\u01FB': 'a',
  '\u01FC': 'AE', '\u01FD': 'ae', '\u01FE': 'O', '\u01FF': 'o',
};

/**
 * Transliterate a single character using the map.
 * Returns the original character if not in the map.
 */
export function transliterateChar(char: string): string {
  return TRANSLITERATION_MAP[char] ?? char;
}

/**
 * Transliterate a string character by character.
 */
export function transliterate(str: string): string {
  let result = '';
  for (const char of str) {
    result += transliterateChar(char);
  }
  return result;
}
