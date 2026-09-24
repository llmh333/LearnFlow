import { describe, expect, it } from 'vitest'
import { formatPhonetic, getPhoneticTranscription } from './phonetics'

describe('getPhoneticTranscription', () => {
  it('returns the IPA value for English', () => {
    expect(getPhoneticTranscription('en', { ipa: '/əˈtʃiːv/' })).toBe('/əˈtʃiːv/')
  })

  it('returns the pinyin value for Chinese', () => {
    expect(getPhoneticTranscription('zh', { pinyin: 'xué xí' })).toBe('xué xí')
  })

  it('returns the reading value for Japanese', () => {
    expect(getPhoneticTranscription('ja', { reading: 'べんきょう' })).toBe('べんきょう')
  })

  it('returns null for a language with no phonetic attribute mapping', () => {
    expect(getPhoneticTranscription('fr', { ipa: '/test/' })).toBeNull()
  })

  it('returns null when attributes are undefined', () => {
    expect(getPhoneticTranscription('en', undefined)).toBeNull()
  })

  it('returns null when the word has no phonetic value recorded', () => {
    expect(getPhoneticTranscription('en', {})).toBeNull()
  })

  it('returns null for a blank/whitespace-only value', () => {
    expect(getPhoneticTranscription('en', { ipa: '   ' })).toBeNull()
  })

  it('returns null for a non-string value', () => {
    expect(getPhoneticTranscription('zh', { pinyin: 42 })).toBeNull()
  })

  it('trims surrounding whitespace', () => {
    expect(getPhoneticTranscription('ja', { reading: '  べんきょう  ' })).toBe('べんきょう')
  })
})

describe('formatPhonetic', () => {
  it('wraps unslashed English IPA in single slashes', () => {
    expect(formatPhonetic('en', 'eɪdʒ')).toBe('/eɪdʒ/')
  })

  it('preserves already-slashed English IPA without adding duplicate slashes', () => {
    expect(formatPhonetic('en', '/eɪdʒ/')).toBe('/eɪdʒ/')
    expect(formatPhonetic('en', '//eɪdʒ//')).toBe('/eɪdʒ/')
  })

  it('leaves Chinese pinyin unchanged', () => {
    expect(formatPhonetic('zh', 'xué xí')).toBe('xué xí')
  })

  it('leaves Japanese reading unchanged', () => {
    expect(formatPhonetic('ja', 'べんきょう')).toBe('べんきょう')
  })
})
