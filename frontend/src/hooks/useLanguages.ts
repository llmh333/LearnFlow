import { useQuery } from '@tanstack/react-query'
import * as languagesApi from '@/api/languages'

export const languageKeys = {
  all: ['languages'] as const,
}

export function useLanguages() {
  return useQuery({ queryKey: languageKeys.all, queryFn: languagesApi.fetchLanguages })
}
