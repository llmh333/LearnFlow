import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  IconTrophy,
  IconSparkles,
  IconArrowRight,
  IconCheckCircle,
} from '@/components/ui/Icon'
import { WordStrokeOrder } from '@/components/review/WordStrokeOrder'
import { useDueReviews, useSubmitReview } from '@/hooks/useReviews'
import { useActiveStudySession, useEndStudySession, useStartStudySession } from '@/hooks/useStudySession'
import { getPhoneticTranscription } from '@/lib/phonetics'
import { isStrokeOrderSupported } from '@/lib/strokeOrder'
import { useUiStore } from '@/stores/uiStore'
import type { DueVocabulary, SrsRating, StudySession } from '@/types/domain'

const RATING_OPTIONS: {
  rating: SrsRating
  label: string
  key: string
  colorClass: string
  subtitle: string
}[] = [
  {
    rating: 'AGAIN',
    label: 'Again',
    key: '1',
    colorClass:
      'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 hover:border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-700',
    subtitle: '< 10 min',
  },
  {
    rating: 'HARD',
    label: 'Hard',
    key: '2',
    colorClass:
      'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700',
    subtitle: '~1 day',
  },
  {
    rating: 'GOOD',
    label: 'Good',
    key: '3',
    colorClass:
      'bg-[#EDFBD8] text-[#365314] border-[#cbebb0] hover:bg-[#e2f7c2] hover:border-[#93D620] dark:bg-[#1E2B11] dark:text-[#B6F23A] dark:border-[#365314]',
    subtitle: 'Standard',
  },
  {
    rating: 'EASY',
    label: 'Easy',
    key: '4',
    colorClass:
      'bg-[#B6F23A]/20 text-[#2b440e] border-[#B6F23A]/50 hover:bg-[#B6F23A]/35 hover:border-[#93D620] dark:bg-[#B6F23A]/15 dark:text-[#B6F23A] dark:border-[#B6F23A]/40',
    subtitle: 'Extended',
  },
]

export function ReviewPage() {
  const [searchParams] = useSearchParams()
  const selectedLanguageCode = useUiStore((state) => state.selectedLanguageCode)
  const setSelectedLanguageCode = useUiStore((state) => state.setSelectedLanguageCode)

  const initialLanguageRef = useRef(
    searchParams.get('language') || useUiStore.getState().selectedLanguageCode,
  )

  useEffect(() => {
    const fromUrl = searchParams.get('language')
    if (fromUrl && fromUrl !== selectedLanguageCode) {
      setSelectedLanguageCode(fromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data: due, isLoading } = useDueReviews({
    language: selectedLanguageCode || undefined,
    limit: 50,
  })
  const submitReview = useSubmitReview()
  const startSession = useStartStudySession()
  const endSession = useEndStudySession()
  const activeSession = useActiveStudySession(initialLanguageRef.current || undefined)

  const [queue, setQueue] = useState<DueVocabulary[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [cardStartedAt, setCardStartedAt] = useState(() => Date.now())
  const [finishedSession, setFinishedSession] = useState<StudySession | null>(null)

  // Non-null once we know whether we resumed an in-progress session (its real wordsReviewed,
  // computed server-side from review_history) or started a fresh one (0). Read once by the
  // queue-seeding effect below; a language switch afterwards always starts a fresh 0 baseline
  // (see isFirstSeed there), since a resumed session's progress belongs to its own language only.
  const [resumedWordsReviewed, setResumedWordsReviewed] = useState<number | null>(null)

  const sessionIdRef = useRef<number | null>(null)
  const sessionEndedRef = useRef(false)
  const sessionInitStartedRef = useRef(false)

  // Resumes the most recent not-yet-ended session instead of always starting a new one — a hard
  // page refresh doesn't reliably run the cleanup effect below, so a session left open by a
  // previous visit would otherwise be abandoned and its progress lost.
  useEffect(() => {
    if (sessionInitStartedRef.current || !activeSession.isSuccess) return
    sessionInitStartedRef.current = true

    if (activeSession.data) {
      sessionIdRef.current = activeSession.data.id
      setResumedWordsReviewed(activeSession.data.wordsReviewed)
    } else {
      startSession.mutate(initialLanguageRef.current || undefined, {
        onSuccess: (session) => {
          sessionIdRef.current = session.id
          setResumedWordsReviewed(0)
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession.isSuccess, activeSession.data])

  useEffect(() => {
    return () => {
      if (sessionIdRef.current !== null && !sessionEndedRef.current) {
        sessionEndedRef.current = true
        endSession.mutate(sessionIdRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Seeds the session's local queue/progress from the server's due list exactly once per
  // language — not on every reference change of `due`. Without this guard, any background
  // refetch of the same query (e.g. React Query's default refetchOnWindowFocus, or a stale
  // invalidation elsewhere) would silently reset `reviewedCount`/`queue` back to their initial
  // values mid-session, since this effect used to run on every `due` change unconditionally.
  const initializedForLanguageRef = useRef<string | null>(null)
  useEffect(() => {
    if (!due || resumedWordsReviewed === null) return
    if (initializedForLanguageRef.current === selectedLanguageCode) return

    const isFirstSeed = initializedForLanguageRef.current === null
    const baseline = isFirstSeed ? resumedWordsReviewed : 0
    initializedForLanguageRef.current = selectedLanguageCode
    setQueue(due)
    setTotalCount(baseline + due.length)
    setReviewedCount(baseline)
    setRevealed(false)
    setCardStartedAt(Date.now())
  }, [due, selectedLanguageCode, resumedWordsReviewed])

  const current = queue[0]
  const phonetic = current
    ? getPhoneticTranscription(current.language.code, current.attributes)
    : null

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

  if (isLoading || resumedWordsReviewed === null) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#365314] border-t-transparent dark:border-[#B6F23A]" />
        <p className="text-sm font-medium text-slate-500">Preparing your review session...</p>
      </div>
    )
  }

  const header = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Spaced Repetition Review
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Recall the meaning, then rate your confidence.
        </p>
      </div>
      <div className="w-full sm:w-44">
        <LanguageSwitcher
          value={selectedLanguageCode}
          onChange={setSelectedLanguageCode}
          includeAll
        />
      </div>
    </div>
  )

  if (totalCount === 0) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
        {header}
        <Card className="flex flex-col items-center justify-center gap-4 py-16 text-center border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <IconCheckCircle size={32} />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              All caught up!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              No words due for review right now.
            </p>
          </div>
          <Link to="/" className="pt-2">
            <Button variant="secondary" size="md">
              Return to Dashboard
            </Button>
          </Link>
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
      <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
        {header}
        <Card className="flex flex-col items-center gap-6 py-12 text-center border-slate-200 bg-white dark:border-[#2C2C2C] dark:bg-[#1E1E1E] shadow-sm">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#365314] text-[#B6F23A] shadow-md dark:bg-[#B6F23A] dark:text-[#1A1A1A]">
              <IconTrophy size={40} />
            </div>
            <div className="absolute -top-2 -right-2">
              <IconSparkles size={24} className="text-[#93D620] dark:text-[#B6F23A] animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-[#1A1A1A] dark:text-white">
              Session complete!
            </h2>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              {finishedSession
                ? `Reviewed ${finishedSession.wordsReviewed} word${finishedSession.wordsReviewed === 1 ? '' : 's'} in ${minutes} min${finishedSession.mistakesCount > 0 ? ` · ${finishedSession.mistakesCount} mistake${finishedSession.mistakesCount === 1 ? '' : 's'}` : ''}.`
                : `You reviewed ${reviewedCount} word${reviewedCount === 1 ? '' : 's'}.`}
            </p>
          </div>

          <div className="flex gap-3">
            <Link to="/">
              <Button variant="primary" className="gap-2 font-semibold">
                <span>Go to Dashboard</span>
                <IconArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const progress = totalCount > 0 ? Math.min(100, Math.round((reviewedCount / totalCount) * 100)) : 0

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      {header}

      {/* Progress tracker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <IconCheckCircle size={14} className="text-[#365314] dark:text-[#B6F23A]" />
            <span>
              {reviewedCount} / {totalCount} reviewed · {queue.length} remaining in queue
            </span>
          </span>
          <span className="font-bold text-[#365314] dark:text-[#B6F23A]">{progress}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EDFBD8] dark:bg-[#2A2A2A]">
          <div
            className="h-full rounded-full bg-[#B6F23A] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Study Flashcard */}
      <div className="relative">
        <Card className="relative flex min-h-72 flex-col items-center justify-center gap-5 p-8 sm:p-12 text-center shadow-md border-slate-200 bg-white dark:border-[#2C2C2C] dark:bg-[#1E1E1E] transition-all">
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="text-xs font-bold">
              {current.language.name}
            </Badge>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1A1A1A] dark:text-white">
            {current.word}
          </h2>

          {revealed ? (
            <div className="flex flex-col items-center gap-4 w-full animate-fade-in">
              <div className="h-px w-24 bg-slate-200 dark:bg-slate-700 my-1" />
              {phonetic && (
                <p className="font-mono text-sm text-slate-500 dark:text-slate-400">
                  {current.language.code === 'en' ? `/${phonetic}/` : phonetic}
                </p>
              )}
              <p className="text-xl sm:text-2xl font-bold text-[#365314] dark:text-[#B6F23A]">
                {current.meaning}
              </p>
              {current.example && (
                <div className="w-full max-w-md rounded-xl bg-[#F8F9FA] p-3.5 border border-slate-200 dark:bg-[#262626] dark:border-[#383838]">
                  <p className="text-sm italic text-slate-700 dark:text-slate-300 leading-relaxed">
                    "{current.example}"
                  </p>
                </div>
              )}
              {isStrokeOrderSupported(current.language.code) && (
                <WordStrokeOrder word={current.word} languageCode={current.language.code} />
              )}
            </div>
          ) : (
            <div className="pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={reveal}
                className="shadow-xs gap-2 font-semibold"
              >
                <span>Show answer</span>
                <span className="rounded-md bg-black/10 px-1.5 py-0.5 text-xs font-mono font-medium text-[#1A1A1A]">
                  Space
                </span>
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* SRS Rating Actions (Revealed state) */}
      {revealed && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-scale-in">
          {RATING_OPTIONS.map((option) => (
            <button
              key={option.rating}
              type="button"
              disabled={submitReview.isPending}
              onClick={() => rate(option.rating)}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-3.5 transition-all duration-150 active:scale-95 cursor-pointer shadow-xs disabled:opacity-50 ${option.colorClass}`}
            >
              <span className="text-sm font-bold">
                {option.label}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-semibold opacity-85">
                <span>({option.key})</span>
                <span>·</span>
                <span>{option.subtitle}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
