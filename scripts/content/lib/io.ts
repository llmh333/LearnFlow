// Shared helpers for the content scripts. Node 22 runs these .ts files directly (type stripping);
// no dependencies, so the scripts work from a plain checkout.
import { createReadStream, readFileSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'

/** Parses `--name value` pairs; throws when a required one is missing. */
export function args(required: string[], argv = process.argv.slice(2)): Record<string, string> {
  const out: Record<string, string> = {}
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith('--') || argv[i + 1] === undefined) {
      throw new Error(`Bad argument near "${argv[i]}"; expected --name value`)
    }
    out[argv[i].slice(2)] = argv[i + 1]
  }
  const missing = required.filter((name) => !(name in out))
  if (missing.length) throw new Error(`Missing: ${missing.map((m) => '--' + m).join(', ')}`)
  return out
}

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

export function writeJson(path: string, value: unknown): void {
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n')
}

/** Streams a TSV file (Tatoeba exports are too big to read whole). */
export async function* tsvRows(path: string): AsyncGenerator<string[]> {
  const lines = createInterface({ input: createReadStream(path, 'utf8'), crlfDelay: Infinity })
  for await (const line of lines) {
    if (line) yield line.split('\t')
  }
}

/** Reads `key<TAB>a|b<TAB>c|d…` (manual translations): key → columns → `|`-separated values. */
export function readPipeTsv(path: string): Map<string, string[][]> {
  const map = new Map<string, string[][]>()
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue
    const [key, ...columns] = line.split('\t')
    map.set(
      key.trim(),
      columns.map((c) => c.split('|').map((v) => v.trim()).filter(Boolean)),
    )
  }
  return map
}

export const KANA = /^[぀-ヿー]+$/u
