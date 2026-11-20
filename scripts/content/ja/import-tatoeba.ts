// Finds short Tatoeba example sentences for a word list and writes candidates for enrich-ai.ts,
// with each sentence's id and author (CC BY 2.0 FR requires crediting every sentence's author).
// Downloads: https://downloads.tatoeba.org/exports/per_language/ — jpn/jpn_sentences_detailed.tsv,
// jpn/jpn-vie_links.tsv, vie/vie_sentences.tsv, jpn/jpn-eng_links.tsv, eng/eng_sentences.tsv.
// Do not use Tatoeba audio (separate licences).
//
//   node scripts/content/ja/import-tatoeba.ts --sentences jpn_sentences_detailed.tsv \
//     --vie-links jpn-vie_links.tsv --vie vie_sentences.tsv --eng-links jpn-eng_links.tsv \
//     --eng eng_sentences.tsv --words words.tsv --out sentences.json [--per-word 2] [--max-length 20]
import { readFileSync } from 'node:fs'
import { args, tsvRows, writeJson } from '../lib/io.ts'
import { parseWords, type WordRequest } from './import-jmdict.ts'

export interface Sentence {
  id: string
  text: string
  author: string
}

export interface SentenceCandidate {
  key: string
  text: string
  translationVi: string | null
  translationEn: string | null
  sourceRef: string
  sourceAuthor: string
  forWord: string
}

/** The form to search for: the written form when there is one, else the reading. */
export const needle = (w: WordRequest) => w.written?.replace(/[～〜]/g, '') || w.reading

/** Shortest sentences first, preferring ones that already have a Vietnamese translation. */
export function pick(
  found: Sentence[],
  vie: Map<string, string>,
  perWord: number,
): Sentence[] {
  return [...found]
    .sort((a, b) => Number(vie.has(b.id)) - Number(vie.has(a.id)) || a.text.length - b.text.length)
    .slice(0, perWord)
}

async function mapLinks(path: string, ids: Set<string>): Promise<Map<string, string>> {
  const links = new Map<string, string>()
  for await (const [from, to] of tsvRows(path)) if (ids.has(from) && !links.has(from)) links.set(from, to)
  return links
}

async function texts(path: string, ids: Set<string>): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  for await (const [id, , text] of tsvRows(path)) if (ids.has(id)) out.set(id, text)
  return out
}

if (import.meta.main) {
  const a = args(['sentences', 'vie-links', 'vie', 'eng-links', 'eng', 'words', 'out'])
  const perWord = Number(a['per-word'] ?? 2)
  const maxLength = Number(a['max-length'] ?? 20)
  const words = parseWords(readFileSync(a.words, 'utf8'))
  const found = new Map<string, Sentence[]>(words.map((w) => [w.key, []]))

  for await (const [id, , text, author] of tsvRows(a.sentences)) {
    if (!author || author === '\\N' || text.length > maxLength) continue
    for (const w of words) {
      const bucket = found.get(w.key)!
      if (bucket.length < 200 && text.includes(needle(w))) bucket.push({ id, text, author })
    }
  }
  const ids = new Set([...found.values()].flat().map((s) => s.id))
  const vieLinks = await mapLinks(a['vie-links'], ids)
  const vie = await texts(a.vie, new Set(vieLinks.values()))
  const engLinks = await mapLinks(a['eng-links'], ids)
  const eng = await texts(a.eng, new Set(engLinks.values()))
  const vieById = new Map([...vieLinks].map(([j, v]) => [j, vie.get(v)!]).filter(([, t]) => t))

  const items: SentenceCandidate[] = []
  const used = new Set<string>()
  for (const w of words) {
    for (const s of pick(found.get(w.key)!.filter((s) => !used.has(s.id)), vieById, perWord)) {
      used.add(s.id)
      items.push({
        key: `ja.sentence.tatoeba-${s.id}`,
        text: s.text,
        translationVi: vieById.get(s.id) ?? null,
        translationEn: eng.get(engLinks.get(s.id) ?? '') ?? null,
        sourceRef: s.id,
        sourceAuthor: s.author,
        forWord: w.key,
      })
    }
  }
  writeJson(a.out, { kind: 'sentence', source: 'tatoeba', items })
  console.log(`${items.length} sentences for ${words.length} words → ${a.out}`)
}
