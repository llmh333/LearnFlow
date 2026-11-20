// Writes content YAML in the shape documented in .claude/rules/content.md. Strings are emitted as
// JSON-style double-quoted scalars, which YAML reads verbatim (no boolean/number surprises).

type Value = string | number | string[] | undefined | null

const q = (s: string) => JSON.stringify(s)

function scalar(value: Exclude<Value, undefined | null>): string {
  if (Array.isArray(value)) return '[' + value.map(q).join(', ') + ']'
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
