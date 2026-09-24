import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as reviewsApi from '@/api/reviews'
import type { DueParams, SubmitReviewPayload } from '@/api/reviews'

export const reviewKeys = {
  due: (params: DueParams) => ['reviews', 'due', params] as const,
  history: (vocabularyId: number) => ['reviews', 'history', vocabularyId] as const,
}

export function useDueReviews(params: DueParams) {
  return useQuery({
    queryKey: reviewKeys.due(params),
    queryFn: () => reviewsApi.fetchDueReviews(params),
  })
}

export function useReviewHistory(vocabularyId: number | undefined) {
  return useQuery({
    queryKey: reviewKeys.history(vocabularyId ?? -1),
    queryFn: () => reviewsApi.fetchReviewHistory(vocabularyId as number),
    enabled: vocabularyId !== undefined,
  })
}

export function useSubmitReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      vocabularyId,
      payload,
    }: {
      vocabularyId: number
      payload: SubmitReviewPayload
    }) => reviewsApi.submitReview(vocabularyId, payload),
    onSuccess: (_data, variables) => {
      // Deliberately does NOT invalidate reviewKeys.due: ReviewPage already manages its review
      // queue/progress locally per submission, and no other screen reads this query. Invalidating
      // it here used to force a mid-session refetch that reset ReviewPage's local progress state.
      queryClient.invalidateQueries({ queryKey: reviewKeys.history(variables.vocabularyId) })
    },
  })
}
