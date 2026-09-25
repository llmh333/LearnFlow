import { apiFetch } from './client'
import type { Exercise, ExerciseAnswerResult } from '@/types/domain'

export interface SubmitExerciseAnswerPayload {
  submittedTokens?: string[]
  selectedOptionIndex?: number
}

export function fetchTodayExercises(language: string): Promise<Exercise[]> {
  return apiFetch<Exercise[]>(`/exercises/today?language=${encodeURIComponent(language)}`)
}

export function submitExerciseAnswer(
  id: number,
  payload: SubmitExerciseAnswerPayload,
): Promise<ExerciseAnswerResult> {
  return apiFetch<ExerciseAnswerResult>(`/exercises/${id}/answer`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
