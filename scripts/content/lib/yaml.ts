// Writes content YAML in the shape documented in .claude/rules/content.md. Strings are emitted as
// JSON-style double-quoted scalars, which YAML reads verbatim (no boolean/number surprises).

type Value = string | number | string[] | Record<string, string[]> | undefined | null

const q = (s: string) => JSON.stringify(s)

function scalar(value: Exclude<Value, undefined | null>): string {
  if (Array.isArray(value)) return '[' + value.map(q).join(', ') + ']'
  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([, v]) => v.length)
    return '{' + entries.map(([k, v]) => `${k}: ${scalar(v)}`).join(', ') + '}'
  }
  return typeof value === 'number' ? String(value) : q(value)
}

/** One section (e.g. `kanji:`) as a block list; undefined/null/empty-array fields are left out. */
export function section(name: string, items: Record<string, Value>[]): string {
  const lines = [`${name}:`]
  for (const item of items) {
    let first = true
    for (const [field, value] of Object.entries(item)) {
      if (value === undefined || value === null) continue
      if (Array.isArray(value) && value.length === 0) continue
      if (typeof value === 'object' && !Array.isArray(value) && !Object.values(value).some((v) => v.length)) continue
      lines.push(`${first ? '  - ' : '    '}${field}: ${scalar(value)}`)
      first = false
    }
  }
  return lines.join('\n') + '\n'
}

/** A whole file: a `#` comment header, then the sections. */
export function document(header: string[], sections: string[]): string {
  return header.map((line) => `# ${line}`.trimEnd()).join('\n') + '\n' + sections.join('\n')
}
