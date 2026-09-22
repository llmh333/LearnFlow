import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReviewPage } from './ReviewPage'

vi.mock('@/api/languages', () => ({
  fetchLanguages: vi.fn().mockResolvedValue([{ id: 1, code: 'en', name: 'English' }]),
}))

const dueWords = [
  {
    vocabularyId: 1,
    language: { id: 1, code: 'en', name: 'English' },
    word: 'achieve',
    meaning: 'đạt được',
    example: 'I want to achieve my goals.',
    attributes: {},
    nextReview: '2026-01-01T00:00:00Z',
    reviewCount: 0,
    memoryStrength: 0,
  },
  {
    vocabularyId: 2,
    language: { id: 1, code: 'en', name: 'English' },
    word: 'banana',
    meaning: 'quả chuối',
    example: null,
    attributes: {},
    nextReview: '2026-01-01T00:00:00Z',
    reviewCount: 0,
    memoryStrength: 0,
  },
]

const fetchDueReviews = vi.fn()
const submitReview = vi.fn()

vi.mock('@/api/reviews', () => ({
  fetchDueReviews: (...args: unknown[]) => fetchDueReviews(...args),
  submitReview: (...args: unknown[]) => submitReview(...args),
}))

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <ReviewPage />
    </QueryClientProvider>,
  )
}

describe('ReviewPage', () => {
  beforeEach(() => {
    fetchDueReviews.mockReset().mockResolvedValue(dueWords)
    submitReview.mockReset().mockResolvedValue({
      vocabularyId: 1,
      lastReview: '2026-01-01T00:00:00Z',
      nextReview: '2026-01-02T00:00:00Z',
      intervalDays: 1,
      easeFactor: 2.5,
      reviewCount: 1,
      successCount: 1,
      failureCount: 0,
      memoryStrength: 100,
    })
  })

  it('shows the word first, then the meaning only after reveal', async () => {
    renderPage()

    expect(await screen.findByText('achieve')).toBeInTheDocument()
    expect(screen.queryByText('đạt được')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /show answer/i }))

    expect(screen.getByText('đạt được')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /good/i })).toBeInTheDocument()
  })

  it('advances to the next card after rating, and submits the chosen rating', async () => {
    renderPage()

    await screen.findByText('achieve')
    fireEvent.click(screen.getByRole('button', { name: /show answer/i }))
    fireEvent.click(screen.getByRole('button', { name: /good/i }))

    await waitFor(() => expect(submitReview).toHaveBeenCalledWith(1, expect.objectContaining({ rating: 'GOOD' })))
    expect(await screen.findByText('banana')).toBeInTheDocument()
  })

  it('shows a completion summary once the queue is empty', async () => {
    renderPage()

    await screen.findByText('achieve')
    fireEvent.click(screen.getByRole('button', { name: /show answer/i }))
    fireEvent.click(screen.getByRole('button', { name: /good/i }))

    await screen.findByText('banana')
    fireEvent.click(screen.getByRole('button', { name: /show answer/i }))
    fireEvent.click(screen.getByRole('button', { name: /good/i }))

    expect(await screen.findByText('Session complete!')).toBeInTheDocument()
    expect(screen.getByText(/you reviewed 2 words/i)).toBeInTheDocument()
  })
})
