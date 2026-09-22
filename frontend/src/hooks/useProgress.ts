import { useQuery } from '@tanstack/react-query'
import * as progressApi from '@/api/progress'

export const progressKeys = {
  summary: (language?: string) => ['progress', 'summary', language] as const,
  retention: (language?: string, days?: number) => ['progress', 'retention', language, days] as const,
  weakAreas: (language?: string) => ['progress', 'weak-areas', language] as const,
  history: (language?: string) => ['progress', 'history', language] as const,
}

export function useProgressSummary(language?: string) {
  return useQuery({
    queryKey: progressKeys.summary(language),
    queryFn: () => progressApi.fetchProgressSummary(language),
  })
}

export function useRetention(language?: string, days = 30) {
  return useQuery({
    queryKey: progressKeys.retention(language, days),
    queryFn: () => progressApi.fetchRetention(language, days),
  })
}

export function useWeakAreas(language?: string) {
  return useQuery({
    queryKey: progressKeys.weakAreas(language),
    queryFn: () => progressApi.fetchWeakAreas(language),
  })
}

export function useProgressHistory(language?: string) {
  return useQuery({
    queryKey: progressKeys.history(language),
    queryFn: () => progressApi.fetchProgressHistory(language),
  })
}
