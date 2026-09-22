import { apiFetch } from './client'
import type { DueVocabulary, ReviewHistoryEntry, ReviewSubmitResult, SrsRating } from '@/types/domain'

export interface DueParams {
  language?: string
  limit?: number
}

export interface SubmitReviewPayload {
  rating: SrsRating
  responseTimeMs?: number
  studySessionId?: number
}

export function fetchDueReviews(params: DueParams): Promise<DueVocabulary[]> {
  const search = new URLSearchParams()
  if (params.language) search.set('language', params.language)
  if (params.limit) search.set('limit', String(params.limit))
  const qs = search.toString()
  return apiFetch<DueVocabulary[]>(`/reviews/due${qs ? `?${qs}` : ''}`)
}

export function submitReview(
  vocabularyId: number,
  payload: SubmitReviewPayload,
): Promise<ReviewSubmitResult> {
  return apiFetch<ReviewSubmitResult>(`/reviews/${vocabularyId}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchReviewHistory(vocabularyId: number): Promise<ReviewHistoryEntry[]> {
  return apiFetch<ReviewHistoryEntry[]>(`/reviews/history/${vocabularyId}`)
}
