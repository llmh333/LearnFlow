import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { IconArrowRight, IconCheckCircle, IconSparkles, IconTrophy } from '@/components/ui/Icon'
import { MultipleChoiceCard } from '@/components/exercises/MultipleChoiceCard'
import { SentenceScrambleCard } from '@/components/exercises/SentenceScrambleCard'
import { useSubmitExerciseAnswer, useTodayExercises } from '@/hooks/useExercises'
import { useUiStore } from '@/stores/uiStore'
import type { Exercise } from '@/types/domain'

interface Feedback {
  correct: boolean
  correctTokens: string[] | null
  correctOptionIndex: number | null
}

export function ExercisesPage() {
  const selectedLanguageCode = useUiStore((state) => state.selectedLanguageCode)
  const setSelectedLanguageCode = useUiStore((state) => state.setSelectedLanguageCode)

  const { data: exercises, isLoading } = useTodayExercises(selectedLanguageCode)
  const submitAnswer = useSubmitExerciseAnswer()

  const [queue, setQueue] = useState<Exercise[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [doneCount, setDoneCount] = useState(0)
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  // Seeds the local queue once per language, same "run once, not on every background refetch"
  // guard ReviewPage uses — and resumes correctly if some of today's exercises were already
  // answered in an earlier visit (an F5 shouldn't force re-answering them).
  const initializedForLanguageRef = useRef<string | null>(null)
  useEffect(() => {
    if (!exercises) return
    if (initializedForLanguageRef.current === selectedLanguageCode) return
    initializedForLanguageRef.current = selectedLanguageCode

    const alreadyDone = exercises.filter((e) => e.completed)
    const remaining = exercises.filter((e) => !e.completed)
    setQueue(remaining)
    setTotalCount(exercises.length)
    setDoneCount(alreadyDone.length)
    setSelectedOptionIndex(null)
    setFeedback(null)
  }, [exercises, selectedLanguageCode])

  const current = queue[0]

  function handleScrambleSubmit(tokens: string[]) {
    if (!current || submitAnswer.isPending) return
    submitAnswer.mutate(
      { id: current.id, payload: { submittedTokens: tokens } },
      {
        onSuccess: (result) =>
          setFeedback({
            correct: result.correct,
            correctTokens: result.correctTokens,
            correctOptionIndex: null,
          }),
      },
    )
  }

  function handleOptionSelect(index: number) {
    if (!current || submitAnswer.isPending || feedback) return
    setSelectedOptionIndex(index)
    submitAnswer.mutate(
      { id: current.id, payload: { selectedOptionIndex: index } },
      {
        onSuccess: (result) =>
          setFeedback({
            correct: result.correct,
            correctTokens: null,
            correctOptionIndex: result.correctOptionIndex,
          }),
      },
    )
  }

  function next() {
    setQueue((prev) => prev.slice(1))
    setDoneCount((count) => count + 1)
    setSelectedOptionIndex(null)
    setFeedback(null)
  }

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#365314] border-t-transparent dark:border-[#B6F23A]" />
        <p className="text-sm font-medium text-slate-500">Preparing today's exercises...</p>
      </div>
    )
  }

  const header = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Daily Exercises
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Sentence scramble and multiple-choice practice, built from your own vocabulary.
        </p>
      </div>
      <div className="w-full sm:w-44">
        <LanguageSwitcher value={selectedLanguageCode} onChange={setSelectedLanguageCode} />
      </div>
    </div>
  )

  if (!current) {
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
              {totalCount === 0 ? 'No exercises for today yet' : "Today's exercises done!"}
            </h2>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              {totalCount === 0
                ? 'Add a few words with example sentences on the Vocabulary page, then come back.'
                : `You completed ${doneCount} exercise${doneCount === 1 ? '' : 's'}.`}
            </p>
          </div>
          <Link to="/">
            <Button variant="primary" className="gap-2 font-semibold">
              <span>Go to Dashboard</span>
              <IconArrowRight size={14} />
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const progress = totalCount > 0 ? Math.min(100, Math.round((doneCount / totalCount) * 100)) : 0

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      {header}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <IconCheckCircle size={14} className="text-[#365314] dark:text-[#B6F23A]" />
            <span>
              {doneCount} / {totalCount} done · {queue.length} remaining
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

      <Card className="relative flex min-h-72 flex-col items-center justify-center gap-5 p-8 sm:p-12 text-center shadow-md border-slate-200 bg-white dark:border-[#2C2C2C] dark:bg-[#1E1E1E]">
        <div className="flex items-center gap-2">
          <Badge variant="primary" className="text-xs font-bold">
            {current.type === 'SENTENCE_SCRAMBLE' ? 'Arrange the sentence' : 'What does it mean?'}
          </Badge>
          {current.source === 'AI' && (
            <Badge variant="tertiary" className="text-xs">
              AI
            </Badge>
          )}
        </div>

        {current.type === 'SENTENCE_SCRAMBLE' ? (
          <SentenceScrambleCard
            key={current.id}
            shuffledTokens={current.shuffledTokens ?? []}
            disabled={submitAnswer.isPending || feedback !== null}
            onSubmit={handleScrambleSubmit}
          />
        ) : (
          <MultipleChoiceCard
            key={current.id}
            question={current.question ?? ''}
            options={current.options ?? []}
            disabled={submitAnswer.isPending || feedback !== null}
            selectedIndex={selectedOptionIndex}
            correctIndex={feedback?.correctOptionIndex ?? null}
            onSelect={handleOptionSelect}
          />
        )}

        {feedback && (
          <div className="flex w-full flex-col items-center gap-3 animate-fade-in">
            <p
              className={
                feedback.correct
                  ? 'text-sm font-bold text-emerald-700 dark:text-emerald-400'
                  : 'text-sm font-bold text-rose-700 dark:text-rose-400'
              }
            >
              {feedback.correct ? 'Correct!' : 'Not quite.'}
            </p>
            {!feedback.correct && feedback.correctTokens && (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Correct order: <span className="font-semibold">{feedback.correctTokens.join(' ')}</span>
              </p>
            )}
            <Button variant="primary" size="sm" className="gap-2 font-semibold" onClick={next}>
              <span>Next</span>
              <IconArrowRight size={14} />
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
