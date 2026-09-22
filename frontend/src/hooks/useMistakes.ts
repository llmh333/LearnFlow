import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as mistakesApi from '@/api/mistakes'

export const mistakeKeys = {
  all: ['mistakes'] as const,
  list: (language?: string, category?: string) => ['mistakes', 'list', language, category] as const,
  recurring: (language?: string) => ['mistakes', 'recurring', language] as const,
  categories: ['mistakes', 'categories'] as const,
}

export function useMistakes(language?: string, category?: string) {
  return useQuery({
    queryKey: mistakeKeys.list(language, category),
    queryFn: () => mistakesApi.fetchMistakes(language, category),
  })
}

export function useRecurringMistakes(language?: string) {
  return useQuery({
    queryKey: mistakeKeys.recurring(language),
    queryFn: () => mistakesApi.fetchRecurringMistakes(language),
  })
}

export function useMistakeCategories() {
  return useQuery({ queryKey: mistakeKeys.categories, queryFn: mistakesApi.fetchMistakeCategories })
}

export function useCreateMistake() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: mistakesApi.createMistake,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mistakeKeys.all }),
  })
}
