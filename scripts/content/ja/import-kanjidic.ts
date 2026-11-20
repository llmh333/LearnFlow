// Picks the kanji of one JLPT level from KANJIDIC2 (jmdict-simplified JSON) and writes candidates
// for enrich-ai.ts. Source: https://github.com/scriptin/jmdict-simplified (kanjidic2-en-*.json),
// CC BY-SA 4.0, © EDRDG.
//
//   node scripts/content/import-kanjidic.ts --input kanjidic2-en.json --level N5 --out kanji-n5.json
import { args, readJson, writeJson } from './lib/io.ts'

/** KANJIDIC2 still uses the old 4-level JLPT; old 4 ≈ N5 and old 3 ≈ N4. N3–N1 have no mapping. */
export const OLD_JLPT_LEVEL: Record<string, number> = { N5: 4, N4: 3 }

interface Reading {
  type: string
  value: string
}
interface Character {
  literal: string
  misc: { strokeCounts: number[]; jlptLevel: number | null; frequency: number | null }
  readingMeaning: {
    groups: { readings: Reading[]; meanings: { lang: string; value: string }[] }[]
  } | null
}

export interface KanjiCandidate {
  key: string
  character: string
  hanViet: string[]
  meaningsEn: string[]
  onyomi: string[]
  kunyomi: string[]
  strokeCount: number
  jlptLevel: string
  sourceRef: string
}

/** "まな.ぶ" → "まな(ぶ)"; prefix/suffix markers ("-") are dropped. */
export function kunyomi(value: string): string {
  const plain = value.replace(/-/g, '')
  const dot = plain.indexOf('.')
  return dot < 0 ? plain : `${plain.slice(0, dot)}(${plain.slice(dot + 1)})`
}

export function toCandidate(c: Character, level: string): KanjiCandidate {
  const groups = c.readingMeaning?.groups ?? []
  const readings = groups.flatMap((g) => g.readings)
  const of = (type: string) => readings.filter((r) => r.type === type).map((r) => r.value)
  return {
    key: `ja.kanji.${c.literal}`,
    character: c.literal,
    hanViet: [...new Set(of('vietnam').map((v) => v.toUpperCase()))],
    meaningsEn: groups.flatMap((g) => g.meanings.filter((m) => m.lang === 'en').map((m) => m.value)),
    onyomi: of('ja_on'),
    kunyomi: [...new Set(of('ja_kun').map(kunyomi))],
    strokeCount: c.misc.strokeCounts[0],
    jlptLevel: level,
    sourceRef: 'U+' + c.literal.codePointAt(0)!.toString(16).toUpperCase(),
  }
}

/** The level's kanji, most frequent first. */
export function select(characters: Character[], level: string): KanjiCandidate[] {
  const old = OLD_JLPT_LEVEL[level]
  if (old === undefined) throw new Error(`KANJIDIC2 has no JLPT data for ${level}; use N5 or N4`)
  return characters
    .filter((c) => c.misc.jlptLevel === old)
    .sort((a, b) => (a.misc.frequency ?? 9999) - (b.misc.frequency ?? 9999))
    .map((c) => toCandidate(c, level))
}

if (import.meta.main) {
  const a = args(['input', 'level', 'out'])
  const kanji = select(readJson<{ characters: Character[] }>(a.input).characters, a.level)
  writeJson(a.out, { kind: 'kanji', source: 'kanjidic2', items: kanji })
  console.log(`${kanji.length} ${a.level} kanji → ${a.out}`)
}
