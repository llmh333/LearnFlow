import { useQuery } from '@tanstack/react-query'
import {
  fetchLevelCounts,
  fetchWordDetail,
  fetchWords,
  type SearchWordsParams,
} from '@/api/dictionary'

export const dictionaryKeys = {
  all: ['dictionary'] as const,
  words: (params: SearchWordsParams) => [...dictionaryKeys.all, 'words', params] as const,
  word: (id: number) => [...dictionaryKeys.all, 'word', id] as const,
  levels: () => [...dictionaryKeys.all, 'levels'] as const,
}

export function useWords(params: SearchWordsParams = {}) {
  return useQuery({
    queryKey: dictionaryKeys.words(params),
    queryFn: () => fetchWords(params),
    staleTime: 5 * 60 * 1000,
  })
}

export function useWordDetail(id: number | null | undefined) {
  return useQuery({
    queryKey: dictionaryKeys.word(id ?? 0),
    queryFn: () => fetchWordDetail(id!),
    enabled: typeof id === 'number' && id > 0,
    staleTime: 10 * 60 * 1000,
  })
}

export function useLevelCounts() {
  return useQuery({
    queryKey: dictionaryKeys.levels(),
    queryFn: fetchLevelCounts,
    staleTime: 15 * 60 * 1000,
  })
}
