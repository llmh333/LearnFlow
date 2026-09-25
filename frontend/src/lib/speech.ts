/** BCP-47 tag per supported language, for SpeechSynthesisUtterance.lang. */
const LANGUAGE_TO_BCP47: Record<string, string> = {
  en: 'en-US',
  zh: 'zh-CN',
  ja: 'ja-JP',
}

/** The Web Speech API isn't universally guaranteed (older browsers, some embedded webviews). */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * Speaks `text` aloud using the browser's built-in text-to-speech voices — free, no API key, no
 * backend involved. Cancels any utterance already in progress first, so rapid clicks don't queue
 * up and play back-to-back.
 */
export function speak(
  text: string,
  languageCode: string,
  handlers?: { onStart?: () => void; onEnd?: () => void },
): void {
  if (!isSpeechSupported()) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = LANGUAGE_TO_BCP47[languageCode] ?? languageCode
  if (handlers?.onStart) utterance.onstart = handlers.onStart
  if (handlers?.onEnd) utterance.onend = handlers.onEnd
  window.speechSynthesis.speak(utterance)
}
