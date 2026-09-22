import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useDueReviews, useSubmitReview } from '@/hooks/useReviews'
import { useEndStudySession, useStartStudySession } from '@/hooks/useStudySession'
import { useUiStore } from '@/stores/uiStore'
import type { DueVocabulary, SrsRating, StudySession } from '@/types/domain'

const RATING_OPTIONS: { rating: SrsRating; label: string; key: string }[] = [
  { rating: 'AGAIN', label: 'Again', key: '1' },
  { rating: 'HARD', label: 'Hard', key: '2' },
  { rating: 'GOOD', label: 'Good', key: '3' },
  { rating: 'EASY', label: 'Easy', key: '4' },
]

export function ReviewPage() {
  const [searchParams] = useSearchParams()
  const selectedLanguageCode = useUiStore((state) => state.selectedLanguageCode)
  const setSelectedLanguageCode = useUiStore((state) => state.setSelectedLanguageCode)

  // Resolved once, synchronously (not via a state subscription) so the URL-sync effect and the
  // session-start effect below agree on the same value even though both only run on mount.
  const initialLanguageRef = useRef(
    searchParams.get('language') || useUiStore.getState().selectedLanguageCode,
  )

  // A link like Dashboard's "Start review" can preselect a language via ?language=; sync it into
  // the shared store once on mount so the filter reflects it too.
  useEffect(() => {
    const fromUrl = searchParams.get('language')
    if (fromUrl && fromUrl !== selectedLanguageCode) {
      setSelectedLanguageCode(fromUrl)
    }
    // Intentionally run only once on mount — the URL param is just an initial hint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data: due, isLoading } = useDueReviews({
    language: selectedLanguageCode || undefined,
    limit: 50,
  })
  const submitReview = useSubmitReview()
  const startSession = useStartStudySession()
  const endSession = useEndStudySession()

  const [queue, setQueue] = useState<DueVocabulary[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [cardStartedAt, setCardStartedAt] = useState(() => Date.now())
  const [finishedSession, setFinishedSession] = useState<StudySession | null>(null)

  const sessionIdRef = useRef<number | null>(null);
  const sessionEndedRef = useRef(false);

  // Start exactly one study session per page visit, tied to whatever language was selected at
  // that moment — switching the language filter later doesn't restart the session.
  useEffect(() => {
    startSession.mutate(initialLanguageRef.current || undefined, {
      onSuccess: (session) => {
        sessionIdRef.current = session.id
      },
    })
    return () => {
      if (sessionIdRef.current !== null && !sessionEndedRef.current) {
        sessionEndedRef.current = true
        endSession.mutate(sessionIdRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  function finishSession() {
    if (sessionIdRef.current === null || sessionEndedRef.current) return
    sessionEndedRef.current = true
    endSession.mutate(sessionIdRef.current, {
      onSuccess: (session) => setFinishedSession(session),
    })
  }

  function rate(rating: SrsRating) {
    if (!current || submitReview.isPending) return
    const responseTimeMs = Date.now() - cardStartedAt
    submitReview.mutate(
      {
        vocabularyId: current.vocabularyId,
        payload: { rating, responseTimeMs, studySessionId: sessionIdRef.current ?? undefined },
      },
      {
        onSuccess: () => {
          setQueue((prev) => {
            const [, ...rest] = prev
            const next = rating === 'AGAIN' ? [...rest, current] : rest
            if (next.length === 0) {
              finishSession()
            }
            return next
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
    const minutes = finishedSession
      ? Math.max(
          1,
          Math.round(
            (new Date(finishedSession.endedAt ?? Date.now()).getTime() -
              new Date(finishedSession.startedAt).getTime()) /
              60000,
          ),
        )
      : null

    return (
      <div className="flex flex-col gap-6">
        {header}
        <Card className="flex flex-col items-center gap-2 py-10 text-center">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Session complete!
          </h2>
          <p className="text-sm text-neutral-500">
            {finishedSession
              ? `Reviewed ${finishedSession.wordsReviewed} word${finishedSession.wordsReviewed === 1 ? '' : 's'} in ${minutes} min${finishedSession.mistakesCount > 0 ? ` · ${finishedSession.mistakesCount} mistake${finishedSession.mistakesCount === 1 ? '' : 's'}` : ''}.`
              : `You reviewed ${reviewedCount} word${reviewedCount === 1 ? '' : 's'}.`}
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
