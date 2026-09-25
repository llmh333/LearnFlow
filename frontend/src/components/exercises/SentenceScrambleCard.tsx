import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'

interface SentenceScrambleCardProps {
  shuffledTokens: string[]
  disabled: boolean
  onSubmit: (tokens: string[]) => void
}

/** Tap-to-order sentence builder — no drag-and-drop dependency needed. Tapping a word moves it
 * from the pool into the built sentence (in tap order); tapping a word already in the sentence
 * removes it back to the pool. */
export function SentenceScrambleCard({ shuffledTokens, disabled, onSubmit }: SentenceScrambleCardProps) {
  const [selected, setSelected] = useState<number[]>([])

  useEffect(() => {
    setSelected([])
  }, [shuffledTokens])

  const available = shuffledTokens.map((_, index) => index).filter((index) => !selected.includes(index))
  const canSubmit = !disabled && selected.length === shuffledTokens.length

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex min-h-14 w-full flex-wrap items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 p-3 dark:border-slate-700">
        {selected.length === 0 && (
          <span className="text-xs text-slate-400">Tap the words below, in order</span>
        )}
        {selected.map((index) => (
          <button
            key={index}
            type="button"
            disabled={disabled}
            onClick={() => setSelected((prev) => prev.filter((i) => i !== index))}
            className="rounded-lg border border-[#365314] bg-[#EDFBD8] px-3 py-1.5 text-sm font-semibold text-[#365314] disabled:opacity-60 dark:border-[#B6F23A] dark:bg-[#B6F23A]/15 dark:text-[#B6F23A]"
          >
            {shuffledTokens[index]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {available.map((index) => (
          <button
            key={index}
            type="button"
            disabled={disabled}
            onClick={() => setSelected((prev) => [...prev, index])}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-300 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {shuffledTokens[index]}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || selected.length === 0}
          onClick={() => setSelected([])}
        >
          Reset
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={!canSubmit}
          onClick={() => onSubmit(selected.map((index) => shuffledTokens[index]))}
        >
          Submit
        </Button>
      </div>
    </div>
  )
}
