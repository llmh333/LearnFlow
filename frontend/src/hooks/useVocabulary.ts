import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as vocabularyApi from '@/api/vocabulary'
import type { VocabularyListParams, VocabularyPayload } from '@/api/vocabulary'

export const vocabularyKeys = {
  all: ['vocabulary'] as const,
  list: (params: VocabularyListParams) => [...vocabularyKeys.all, 'list', params] as const,
  detail: (id: number) => [...vocabularyKeys.all, 'detail', id] as const,
  tags: ['vocabulary', 'tags'] as const,
}

export function useVocabularyList(params: VocabularyListParams) {
  return useQuery({
    queryKey: vocabularyKeys.list(params),
    queryFn: () => vocabularyApi.fetchVocabularyList(params),
  })
}

export function useVocabularyTags() {
  return useQuery({ queryKey: vocabularyKeys.tags, queryFn: vocabularyApi.fetchVocabularyTags })
}

export function useCreateVocabulary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: vocabularyApi.createVocabulary,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vocabularyKeys.all }),
  })
}

export function useUpdateVocabulary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: VocabularyPayload }) =>
      vocabularyApi.updateVocabulary(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vocabularyKeys.all }),
  })
}

export function useDeleteVocabulary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: vocabularyApi.deleteVocabulary,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vocabularyKeys.all }),
  })
}
