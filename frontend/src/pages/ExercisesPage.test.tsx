import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExercisesPage } from './ExercisesPage'

const scrambleExercise = {
  id: 1,
  languageCode: 'en',
  type: 'SENTENCE_SCRAMBLE' as const,
  source: 'DETERMINISTIC' as const,
  shuffledTokens: ['goals.', 'I', 'achieve', 'want', 'to'],
  question: null,
  options: null,
  completed: false,
  correct: null,
}

const choiceExercise = {
  id: 2,
  languageCode: 'en',
  type: 'MULTIPLE_CHOICE' as const,
  source: 'AI' as const,
  shuffledTokens: null,
  question: 'What does "achieve" mean?',
  options: ['quả chuối', 'đạt được', 'học tập', 'làm việc'],
  completed: false,
  correct: null,
}

const fetchTodayExercises = vi.fn()
const submitExerciseAnswer = vi.fn()

vi.mock('@/api/exercises', () => ({
  fetchTodayExercises: (...args: unknown[]) => fetchTodayExercises(...args),
  submitExerciseAnswer: (...args: unknown[]) => submitExerciseAnswer(...args),
}))

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/exercises']}>
        <ExercisesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ExercisesPage', () => {
  beforeEach(() => {
    fetchTodayExercises.mockReset().mockResolvedValue([scrambleExercise, choiceExercise])
    submitExerciseAnswer.mockReset()
  })

  it('lets the learner tap words in order and submit a sentence scramble', async () => {
    submitExerciseAnswer.mockResolvedValue({
      id: 1,
      correct: true,
      correctTokens: ['I', 'want', 'to', 'achieve', 'goals.'],
      correctOptionIndex: null,
    })
    renderPage()

    await screen.findByText('Tap the words below, in order')

    fireEvent.click(screen.getByText('I'))
    fireEvent.click(screen.getByText('want'))
    fireEvent.click(screen.getByText('to'))
    fireEvent.click(screen.getByText('achieve'))
    fireEvent.click(screen.getByText('goals.'))

    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    await screen.findByText('Correct!')
    expect(submitExerciseAnswer).toHaveBeenCalledWith(1, {
      submittedTokens: ['I', 'want', 'to', 'achieve', 'goals.'],
    })
  })

  it('lets the learner pick a multiple-choice option and shows feedback', async () => {
    fetchTodayExercises.mockResolvedValue([choiceExercise])
    submitExerciseAnswer.mockResolvedValue({
      id: 2,
      correct: false,
      correctTokens: null,
      correctOptionIndex: 1,
    })
    renderPage()

    await screen.findByText('What does "achieve" mean?')
    fireEvent.click(screen.getByText('quả chuối'))

    await screen.findByText('Not quite.')
    expect(submitExerciseAnswer).toHaveBeenCalledWith(2, { selectedOptionIndex: 0 })
  })

  it('advances to the next exercise after clicking Next', async () => {
    submitExerciseAnswer.mockResolvedValue({
      id: 2,
      correct: true,
      correctTokens: null,
      correctOptionIndex: 1,
    })
    fetchTodayExercises.mockResolvedValue([choiceExercise])
    renderPage()

    await screen.findByText('What does "achieve" mean?')
    fireEvent.click(screen.getByText('đạt được'))
    await screen.findByText('Correct!')

    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    expect(await screen.findByText(/exercises done/i)).toBeInTheDocument()
  })

  it('shows an empty state when there are no exercises for today', async () => {
    fetchTodayExercises.mockResolvedValue([])
    renderPage()

    expect(await screen.findByText('No exercises for today yet')).toBeInTheDocument()
  })
})
