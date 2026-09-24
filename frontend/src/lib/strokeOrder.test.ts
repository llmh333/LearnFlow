import { describe, expect, it } from 'vitest'
import { isStrokeOrderSupported, splitIntoCjkCharacters } from './strokeOrder'

describe('isStrokeOrderSupported', () => {
  it('supports zh and ja', () => {
    expect(isStrokeOrderSupported('zh')).toBe(true)
    expect(isStrokeOrderSupported('ja')).toBe(true)
  })

  it('does not support en', () => {
    expect(isStrokeOrderSupported('en')).toBe(false)
  })
})

describe('splitIntoCjkCharacters', () => {
  it('splits a Chinese word into its individual characters', () => {
    expect(splitIntoCjkCharacters('工作')).toEqual(['工', '作'])
  })

  it('splits a Japanese word mixing kanji and kana', () => {
    expect(splitIntoCjkCharacters('食べ物')).toEqual(['食', 'べ', '物'])
  })

  it('ignores parenthetical alt-reading punctuation some seeded Chinese words have', () => {
    expect(splitIntoCjkCharacters('这 (这儿)')).toEqual(['这', '这', '儿'])
  })

  it('returns an empty array for a word with no CJK/kana characters', () => {
    expect(splitIntoCjkCharacters('achieve')).toEqual([])
  })
})
