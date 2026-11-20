// Run: node --test scripts/content/scripts.test.ts  (pure functions only; no source files needed)
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { kunyomi, select } from './ja/import-kanjidic.ts'
import { lookup, parseWords, pos, toCandidate } from './ja/import-jmdict.ts'
import { needle, pick } from './ja/import-tatoeba.ts'
import { toYamlItem } from './enrich-ai.ts'
import { section } from './lib/yaml.ts'

test('kunyomi marks okurigana and drops affix dashes', () => {
  assert.equal(kunyomi('まな.ぶ'), 'まな(ぶ)')
  assert.equal(kunyomi('-ごと'), 'ごと')
  assert.equal(kunyomi('ひと'), 'ひと')
})

test('select maps N5 to the old JLPT level 4, most frequent first', () => {
  const ch = (literal: string, jlptLevel: number, frequency: number) => ({
    literal,
    misc: { strokeCounts: [1], jlptLevel, frequency },
    readingMeaning: { groups: [{ readings: [{ type: 'vietnam', value: 'Học' }], meanings: [] }] },
  })
  const out = select([ch('学', 4, 63), ch('日', 4, 1), ch('漢', 2, 1)], 'N5')
  assert.deepEqual(out.map((k) => k.character), ['日', '学'])
  assert.deepEqual(out[0].hanViet, ['HỌC'])
  assert.throws(() => select([], 'N3'))
})

test('lookup needs the same written form and reading, common entries first', () => {
  const entry = (id: string, kanji: string, kana: string, common: boolean) => ({
    id,
    kanji: kanji ? [{ text: kanji, common }] : [],
    kana: [{ text: kana, common }],
    sense: [{ partOfSpeech: ['n', 'vs'], gloss: [{ text: 'study' }] }],
  })
  const entries = [entry('1', '勉強', 'べんきょう', false), entry('2', '勉強', 'べんきょう', true)]
  const [word] = parseWords('ja.word.benkyou\t勉強\tべんきょう\tN5')
  assert.equal(lookup(entries, word)?.id, '2')
  assert.equal(lookup(entries, { ...word, reading: 'べんきょ' }), undefined)
  assert.deepEqual(toCandidate(word, entries[1]).partOfSpeech, ['noun', 'suru verb'])
  assert.equal(pos('v5k'), 'godan verb')
})

test('tatoeba picks translated, then shorter sentences', () => {
  const s = (id: string, text: string) => ({ id, text, author: 'a' })
  const picked = pick([s('1', '長い文です。'), s('2', '短い。'), s('3', 'もっと長い文。')], new Map([['3', 'x']]), 2)
  assert.deepEqual(picked.map((p) => p.id), ['3', '2'])
  assert.equal(needle({ key: 'k', written: '～円', reading: 'えん', level: null }), '円')
})

test('yaml writes reading maps inline and skips empty kinds', () => {
  assert.equal(
    section('characters', [{ key: 'k', readings: { on: ['ガク'], kun: [] } }]),
    'characters:\n  - key: "k"\n    readings: {on: ["ガク"]}\n',
  )
})

test('yaml output quotes strings and skips empty fields', () => {
  const item = toYamlItem('word', 'jmdict', { key: 'ja.word.no', written: null, reading: 'no', meaningsEn: [], partOfSpeech: [], level: 'N5', sourceRef: '1' }, ['không'])
  assert.equal(
    section('words', [item]),
    'words:\n  - key: "ja.word.no"\n    status: "draft"\n    source: "jmdict"\n    sourceRef: "1"\n' +
      '    reading: "no"\n    meaningsVi: ["không"]\n    level: "n5"\n',
  )
})
