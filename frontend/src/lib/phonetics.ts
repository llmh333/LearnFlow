/** Whitelisted phonetic-transcription attribute key per language (see D9 /
 * VocabularyAttributesValidator on the backend): en -> ipa, zh -> pinyin, ja -> reading. */
const PHONETIC_ATTRIBUTE_KEY: Record<string, string> = {
  en: 'ipa',
  zh: 'pinyin',
  ja: 'reading',
}

/**
 * Returns the word's phonetic transcription (IPA/pinyin/reading) for its language, or `null` if
 * the language isn't recognized or the word has none recorded.
 */
export function getPhoneticTranscription(
  languageCode: string,
  attributes: Record<string, unknown> | undefined,
): string | null {
  const key = PHONETIC_ATTRIBUTE_KEY[languageCode]
  if (!key) return null
  const value = attributes?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}
