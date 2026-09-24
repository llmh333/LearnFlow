/** Stroke-order diagrams are only meaningful for character-based scripts. */
const STROKE_ORDER_LANGUAGES = new Set(['zh', 'ja'])

export function isStrokeOrderSupported(languageCode: string): boolean {
  return STROKE_ORDER_LANGUAGES.has(languageCode)
}

const CJK_CHARACTER_PATTERN =
  /[一-鿿㐀-䶿぀-ゟ゠-ヿ豈-﫿]/gu

/** Extracts the individual Han/kana characters from a word, in order, skipping anything else
 * (spaces, punctuation like the "(...)" some seeded Chinese words use for an alt reading). */
export function splitIntoCjkCharacters(word: string): string[] {
  return word.match(CJK_CHARACTER_PATTERN) ?? []
}
