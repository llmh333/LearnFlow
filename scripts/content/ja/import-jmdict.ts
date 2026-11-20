// Looks words up in JMdict (jmdict-simplified JSON) and writes candidates for enrich-ai.ts with the
// JMdict id, part of speech and English glosses. Source: https://github.com/scriptin/jmdict-simplified
// (jmdict-eng-*.json), CC BY-SA 4.0, © EDRDG.
//
//   node scripts/content/import-jmdict.ts --input jmdict-eng.json --words words.tsv --out words.json
// words.tsv: one word per line, `key<TAB>written<TAB>reading<TAB>level` (written may be empty).
import { readFileSync } from 'node:fs'
import { args, readJson, writeJson } from './lib/io.ts'

interface Sense {
  partOfSpeech: string[]
  gloss: { text: string }[]
}
interface Entry {
  id: string
  kanji: { text: string; common: boolean }[]
  kana: { text: string; common: boolean }[]
  sense: Sense[]
}

export interface WordRequest {
  key: string
  written: string | null
  reading: string
  jlptLevel: string | null
}

export interface WordCandidate extends WordRequest {
  sourceRef: string
  partOfSpeech: string[]
  meaningsEn: string[]
}

export function parseWords(tsv: string): WordRequest[] {
  return tsv
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('#'))
    .map((line) => {
      const [key, written, reading, level] = line.split('\t').map((s) => s?.trim() ?? '')
      return { key, written: written || null, reading, jlptLevel: level || null }
    })
}

/** The best entry for a word: same written form (or kana-only) and reading, common entries first. */
export function lookup(entries: Entry[], word: WordRequest): Entry | undefined {
  const matches = entries.filter(
    (e) =>
      e.kana.some((k) => k.text === word.reading) &&
      (word.written ? e.kanji.some((k) => k.text === word.written) : true),
  )
  const common = (e: Entry) =>
    e.kana.some((k) => k.common && k.text === word.reading) ||
    e.kanji.some((k) => k.common && k.text === word.written)
  return matches.find(common) ?? matches[0]
}

/** Readable names for the JMdict part-of-speech codes common at N5–N4; others stay as codes. */
export const POS: Record<string, string> = {
  n: 'noun',
  pn: 'pronoun',
  'adj-pn': 'pre-noun adjectival',
  'adj-i': 'i-adjective',
  'adj-na': 'na-adjective',
  'adj-no': 'no-adjective',
  adv: 'adverb',
  exp: 'expression',
  int: 'interjection',
  conj: 'conjunction',
  prt: 'particle',
  ctr: 'counter',
  suf: 'suffix',
  pref: 'prefix',
  num: 'numeric',
  v1: 'ichidan verb',
  vs: 'suru verb',
  'vs-i': 'suru verb',
  vk: 'kuru verb',
  vt: 'transitive verb',
  vi: 'intransitive verb',
}

export const pos = (code: string) => POS[code] ?? (code.startsWith('v5') ? 'godan verb' : code)

/**
 * Part of speech and glosses of the first sense only: later senses add rarer or unsuitable meanings
 * (e.g. slang) that a learner's entry should not show unreviewed.
 */
export function toCandidate(word: WordRequest, entry: Entry): WordCandidate {
  const first = entry.sense[0]
  return {
    ...word,
    sourceRef: entry.id,
    partOfSpeech: [...new Set((first?.partOfSpeech ?? []).map(pos))],
    meaningsEn: first ? [first.gloss.map((g) => g.text).join(', ')] : [],
  }
}

if (import.meta.main) {
  const a = args(['input', 'words', 'out'])
  const entries = readJson<{ words: Entry[] }>(a.input).words
  const items: WordCandidate[] = []
  for (const word of parseWords(readFileSync(a.words, 'utf8'))) {
    const entry = lookup(entries, word)
    if (entry) items.push(toCandidate(word, entry))
    else console.warn(`not in JMdict: ${word.key} ${word.written ?? ''} ${word.reading}`)
  }
  writeJson(a.out, { kind: 'word', source: 'jmdict', items })
  console.log(`${items.length} words → ${a.out}`)
}
