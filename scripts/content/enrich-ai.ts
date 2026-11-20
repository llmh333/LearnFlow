// Turns import-*.ts candidates into content YAML (status: draft), filling the Vietnamese fields
// either from a hand-written TSV (--vi) or with Claude. The YAML header records the model and the
// exact prompt so the run can be repeated (.claude/rules/content.md).
//
//   node scripts/content/enrich-ai.ts --in kanji-n5.json --out backend/.../content/ja/kanji/n5.yaml \
//     [--vi kanji-n5.vi.tsv] [--model claude-opus-5-5] [--batch 40]
//
// --vi file: `key<TAB>value|value…` — meanings for words/kanji; for sentences the first value is the
// Vietnamese translation and the optional second one the kana reading. Kanji may add a third column
// with the Hán Việt reading(s) to keep, replacing KANJIDIC2's full list (which mixes in Nôm readings).
// Without --vi the script calls the Claude API (`npm install` here first; credentials from
// ANTHROPIC_API_KEY or `ant auth login`).
import { existsSync } from 'node:fs'
import { writeFileSync } from 'node:fs'
import { args, readJson, readPipeTsv } from './lib/io.ts'
import { document, section } from './lib/yaml.ts'

type Kind = 'kanji' | 'word' | 'sentence'
type Candidate = Record<string, unknown> & { key: string }
interface Candidates {
  kind: Kind
  source: string
  items: Candidate[]
}

export const PROMPTS: Record<Kind, string> = {
  kanji:
    'You write Vietnamese meanings for Japanese kanji for Vietnamese learners (JLPT N5/N4). For each ' +
    'item give 1–3 short, natural Vietnamese meanings, most common first, lower case, no Hán-Việt ' +
    'reading (it is stored separately). Use the English meanings only as a hint.',
  word:
    'You write Vietnamese meanings for Japanese vocabulary for Vietnamese learners (JLPT N5/N4). For ' +
    'each item give 1–3 short, natural Vietnamese meanings, most common sense first, lower case. Mark ' +
    'register in parentheses when it matters, e.g. "(lịch sự)", "(khiêm nhường)".',
  sentence:
    'You translate short Japanese example sentences for Vietnamese learners (JLPT N5/N4). For each ' +
    'item return [natural Vietnamese translation, full kana reading of the Japanese sentence keeping ' +
    'its punctuation].',
}

/** Builds the YAML item for one candidate plus its Vietnamese values. */
export function toYamlItem(
  kind: Kind,
  source: string,
  c: Candidate,
  vi: string[],
  hanViet?: string[],
) {
  const base = { key: c.key, status: 'draft', source }
  if (kind === 'kanji') {
    return {
      ...base,
      sourceRef: c.sourceRef as string,
      character: c.character as string,
      hanViet: hanViet?.length ? hanViet : (c.hanViet as string[]),
      meaningsVi: vi,
      meaningsEn: c.meaningsEn as string[],
      onyomi: c.onyomi as string[],
      kunyomi: c.kunyomi as string[],
      strokeCount: c.strokeCount as number,
      jlptLevel: (c.jlptLevel as string).toLowerCase(),
    }
  }
  if (kind === 'word') {
    return {
      ...base,
      sourceRef: c.sourceRef as string,
      written: c.written as string | null,
      reading: c.reading as string,
      meaningsVi: vi,
      meaningsEn: c.meaningsEn as string[],
      partOfSpeech: c.partOfSpeech as string[],
      jlptLevel: (c.jlptLevel as string | null)?.toLowerCase(),
    }
  }
  return {
    ...base,
    sourceRef: c.sourceRef as string,
    sourceAuthor: c.sourceAuthor as string,
    text: c.text as string,
    reading: vi[1] ?? (c.reading as string | undefined),
    translationVi: vi[0] ?? (c.translationVi as string),
    translationEn: c.translationEn as string | null,
  }
}

async function translateWithClaude(
  kind: Kind,
  items: Candidate[],
  model: string,
  batch: number,
): Promise<Map<string, string[]>> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic()
  const schema = {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: { key: { type: 'string' }, values: { type: 'array', items: { type: 'string' } } },
          required: ['key', 'values'],
          additionalProperties: false,
        },
      },
    },
    required: ['items'],
    additionalProperties: false,
  }
  const out = new Map<string, string[]>()
  for (let i = 0; i < items.length; i += batch) {
    const chunk = items.slice(i, i + batch)
    const response = await client.messages.create({
      model,
      max_tokens: 16000,
      system: PROMPTS[kind],
      messages: [{ role: 'user', content: JSON.stringify(chunk) }],
      output_config: { format: { type: 'json_schema', schema } },
    })
    if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') {
      throw new Error(`Batch ${i / batch + 1} stopped with ${response.stop_reason}`)
    }
    const text = response.content.find((b) => b.type === 'text')
    if (!text || text.type !== 'text') throw new Error('No text in response')
    // Never trust model output blindly: keep only known keys with non-empty strings.
    const keys = new Set(chunk.map((c) => c.key))
    for (const { key, values } of JSON.parse(text.text).items as { key: string; values: string[] }[]) {
      const clean = values.map((v) => v.trim()).filter(Boolean)
      if (keys.has(key) && clean.length) out.set(key, clean)
    }
    console.log(`translated ${Math.min(i + batch, items.length)}/${items.length}`)
  }
  return out
}

if (import.meta.main) {
  const a = args(['in', 'out'])
  const { kind, source, items } = readJson<Candidates>(a.in)
  const manual = a.vi !== undefined
  if (manual && !existsSync(a.vi)) throw new Error(`No such file: ${a.vi}`)
  const model = a.model ?? 'claude-opus-5-5'
  const columns = manual ? readPipeTsv(a.vi) : new Map<string, string[][]>()
  const vi = manual
    ? new Map([...columns].map(([key, cols]) => [key, cols[0] ?? []]))
    : await translateWithClaude(kind, items, model, Number(a.batch ?? 40))

  const missing = items.filter((c) => !vi.get(c.key)?.length && !(kind === 'sentence' && c.translationVi))
  if (missing.length) throw new Error(`No Vietnamese for: ${missing.map((m) => m.key).join(', ')}`)

  const yamlItems = items.map((c) =>
    toYamlItem(kind, source, c, vi.get(c.key) ?? [], columns.get(c.key)?.[1]),
  )
  const sectionName = kind === 'word' ? 'words' : kind === 'sentence' ? 'sentences' : 'kanji'
  const header = [
    `Generated by scripts/content/enrich-ai.ts from ${a.in.split('/').pop()} (source: ${source}).`,
    manual
      ? `Vietnamese: hand-written/AI-drafted in ${a.vi.split('/').pop()}; a person must review before "reviewed".`
      : `Vietnamese: ${model}, prompt: ${PROMPTS[kind]}`,
  ]
  writeFileSync(a.out, document(header, [section(sectionName, yamlItems)]))
  console.log(`${yamlItems.length} ${sectionName} → ${a.out}`)
}
