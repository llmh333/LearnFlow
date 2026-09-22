import { useEffect, useState } from 'react'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useDueReviews, useSubmitReview } from '@/hooks/useReviews'
import { useUiStore } from '@/stores/uiStore'
import type { DueVocabulary, SrsRating } from '@/types/domain'

const RATING_OPTIONS: { rating: SrsRating; label: string; key: string }[] = [
  { rating: 'AGAIN', label: 'Again', key: '1' },
  { rating: 'HARD', label: 'Hard', key: '2' },
  { rating: 'GOOD', label: 'Good', key: '3' },
  { rating: 'EASY', label: 'Easy', key: '4' },
]

export function ReviewPage() {
  const selectedLanguageCode = useUiStore((state) => state.selectedLanguageCode)
  const setSelectedLanguageCode = useUiStore((state) => state.setSelectedLanguageCode)

  const { data: due, isLoading } = useDueReviews({
    language: selectedLanguageCode || undefined,
    limit: 50,
  })
  const submitReview = useSubmitReview()

  const [queue, setQueue] = useState<DueVocabulary[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [cardStartedAt, setCardStartedAt] = useState(() => Date.now())

  useEffect(() => {
    if (due) {
      setQueue(due)
      setTotalCount(due.length)
      setReviewedCount(0)
      setRevealed(false)
      setCardStartedAt(Date.now())
    }
  }, [due])

  const current = queue[0]

  function reveal() {
    setRevealed(true)
  }

  function rate(rating: SrsRating) {
    if (!current || submitReview.isPending) return
    const responseTimeMs = Date.now() - cardStartedAt
    submitReview.mutate(
      { vocabularyId: current.vocabularyId, payload: { rating, responseTimeMs } },
      {
        onSuccess: () => {
          setQueue((prev) => {
            const [, ...rest] = prev
            return rating === 'AGAIN' ? [...rest, current] : rest
          })
          if (rating !== 'AGAIN') {
            setReviewedCount((count) => count + 1)
          }
          setRevealed(false)
          setCardStartedAt(Date.now())
        },
      },
    )
  }

  // Re-registered every render (cheap, no deps array) so the closure always sees the latest
  // `current`/`revealed` without needing useCallback plumbing.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!current) return
      if (event.code === 'Space') {
        event.preventDefault()
        if (!revealed) reveal()
        return
      }
      if (!revealed) return
      const option = RATING_OPTIONS.find((candidate) => candidate.key === event.key)
      if (option) rate(option.rating)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  if (isLoading) {
    return <p className="text-sm text-neutral-500">Loading...</p>
  }

  const header = (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Review</h1>
      <div className="w-40">
        <LanguageSwitcher value={selectedLanguageCode} onChange={setSelectedLanguageCode} includeAll />
      </div>
    </div>
  )

  if (totalCount === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Card>
          <p className="text-sm text-neutral-500">No words due for review right now.</p>
        </Card>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Card className="flex flex-col items-center gap-2 py-10 text-center">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Session complete!
          </h2>
          <p className="text-sm text-neutral-500">
            You reviewed {reviewedCount} word{reviewedCount === 1 ? '' : 's'}.
          </p>
        </Card>
      </div>
    )
  }

  const progress = totalCount > 0 ? Math.min(100, Math.round((reviewedCount / totalCount) * 100)) : 0

  return (
    <div className="flex flex-col gap-6">
      {header}

      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-full bg-neutral-900 transition-all dark:bg-white"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-neutral-500">
        {reviewedCount} / {totalCount} reviewed · {queue.length} remaining in queue
      </p>

      <Card className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
        <span className="text-xs uppercase tracking-wide text-neutral-400">
          {current.language.name}
        </span>
        <h2 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
          {current.word}
        </h2>
        {revealed ? (
          <>
            <p className="text-lg text-neutral-700 dark:text-neutral-300">{current.meaning}</p>
            {current.example && (
              <p className="text-sm italic text-neutral-500">{current.example}</p>
            )}
          </>
        ) : (
          <Button onClick={reveal}>Show answer (Space)</Button>
        )}
      </Card>

      {revealed && (
        <div className="grid grid-cols-4 gap-2">
          {RATING_OPTIONS.map((option) => (
            <Button
              key={option.rating}
              variant="secondary"
              disabled={submitReview.isPending}
              onClick={() => rate(option.rating)}
            >
              {option.label} ({option.key})
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
