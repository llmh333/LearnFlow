import { useEffect, useState } from 'react'
import { IconRotate } from '@/components/ui/Icon'

// Bundled locally by scripts/vendor-stroke-order-svgs.mjs for the current seed vocabulary. Any
// character not found there (e.g. a word the user added later) falls back to fetching live from
// AnimCJK's jsdelivr-hosted CDN mirror — same source, just not pre-vendored.
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/parsimonhi/animCJK@master'
const REMOTE_DIRS_BY_LANGUAGE: Record<string, string[]> = {
  zh: ['svgsZhHans'],
  ja: ['svgsJa', 'svgsJaKana'],
}

async function loadSvg(character: string, languageCode: string): Promise<string | null> {
  const codepoint = character.codePointAt(0)
  if (codepoint === undefined) return null

  const local = await fetch(`/stroke-order/${codepoint}.svg`)
  if (local.ok) return local.text()

  for (const dir of REMOTE_DIRS_BY_LANGUAGE[languageCode] ?? []) {
    const remote = await fetch(`${CDN_BASE}/${dir}/${codepoint}.svg`)
    if (remote.ok) return remote.text()
  }
  return null
}

/** Animated stroke-order diagram for a single Han/kana character (see WordStrokeOrder for
 * multi-character words). The SVG's own embedded CSS animation runs once on mount; "replay"
 * remounts the node (via `key`) to restart it, since a plain CSS animation can't be rewound. */
export function StrokeOrderDiagram({
  character,
  languageCode,
}: {
  character: string
  languageCode: string
}) {
  const [svg, setSvg] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [playCount, setPlayCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    setSvg(null)
    setFailed(false)
    loadSvg(character, languageCode).then((result) => {
      if (cancelled) return
      if (result) setSvg(result)
      else setFailed(true)
    })
    return () => {
      cancelled = true
    }
  }, [character, languageCode])

  if (failed) {
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-slate-300 text-2xl text-slate-400 dark:border-slate-700">
        {character}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        {svg ? (
          <div
            key={playCount}
            className="h-16 w-16 [&_svg]:h-full [&_svg]:w-full"
            // Source is always a fixed bundled asset or the AnimCJK CDN — never user input.
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
        )}
      </div>
      {svg && (
        <button
          type="button"
          onClick={() => setPlayCount((count) => count + 1)}
          className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <IconRotate size={11} />
          <span>Replay</span>
        </button>
      )}
    </div>
  )
}
