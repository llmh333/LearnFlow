import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isSpeechSupported, speak } from './speech'

describe('speech', () => {
  const speakMock = vi.fn()
  const cancelMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('speechSynthesis', { speak: speakMock, cancel: cancelMock })
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      vi.fn().mockImplementation(function (this: { text: string; lang: string }, text: string) {
        this.text = text
        this.lang = ''
      }),
    )
  })

  afterEach(() => {
    speakMock.mockReset()
    cancelMock.mockReset()
    vi.unstubAllGlobals()
  })

  describe('isSpeechSupported', () => {
    it('is true when window.speechSynthesis exists', () => {
      expect(isSpeechSupported()).toBe(true)
    })

    it('is false when window.speechSynthesis is missing', () => {
      vi.unstubAllGlobals()
      expect(isSpeechSupported()).toBe(false)
    })
  })

  describe('speak', () => {
    it('cancels any in-flight utterance before speaking a new one', () => {
      const callOrder: string[] = []
      cancelMock.mockImplementation(() => callOrder.push('cancel'))
      speakMock.mockImplementation(() => callOrder.push('speak'))

      speak('achieve', 'en')

      expect(callOrder).toEqual(['cancel', 'speak'])
    })

    it('maps each supported language to its BCP-47 tag', () => {
      speak('achieve', 'en')
      expect(speakMock.mock.calls[0][0].lang).toBe('en-US')

      speak('学习', 'zh')
      expect(speakMock.mock.calls[1][0].lang).toBe('zh-CN')

      speak('勉強', 'ja')
      expect(speakMock.mock.calls[2][0].lang).toBe('ja-JP')
    })

    it('falls back to the raw language code when unrecognized', () => {
      speak('bonjour', 'fr')
      expect(speakMock.mock.calls[0][0].lang).toBe('fr')
    })

    it('does nothing when speech synthesis is unsupported', () => {
      vi.unstubAllGlobals()
      expect(() => speak('achieve', 'en')).not.toThrow()
    })
  })
})
