import { useMutation, useQuery } from '@tanstack/react-query'
import * as exercisesApi from '@/api/exercises'
import type { SubmitExerciseAnswerPayload } from '@/api/exercises'

export const exerciseKeys = {
  today: (language: string) => ['exercises', 'today', language] as const,
}

export function useTodayExercises(language: string) {
  return useQuery({
    queryKey: exerciseKeys.today(language),
    queryFn: () => exercisesApi.fetchTodayExercises(language),
    enabled: Boolean(language),
  })
}

export function useSubmitExerciseAnswer() {
  // Deliberately does NOT invalidate exerciseKeys.today: ExercisesPage manages its own local
  // queue/progress per submission, same rationale as useReviews' useSubmitReview.
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SubmitExerciseAnswerPayload }) =>
      exercisesApi.submitExerciseAnswer(id, payload),
  })
}
