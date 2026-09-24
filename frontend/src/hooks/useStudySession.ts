import { useMutation, useQuery } from '@tanstack/react-query'
import * as studySessionsApi from '@/api/studySessions'

export function useStartStudySession() {
  return useMutation({ mutationFn: studySessionsApi.startStudySession })
}

export function useEndStudySession() {
  return useMutation({ mutationFn: studySessionsApi.endStudySession })
}

/**
 * Checked once when a review session starts, to resume an in-progress session (e.g. after a page
 * refresh) instead of silently starting a new one and losing track of what was already reviewed.
 */
export function useActiveStudySession(languageCode?: string) {
  return useQuery({
    queryKey: ['study-sessions', 'active', languageCode ?? null],
    queryFn: () => studySessionsApi.fetchActiveStudySession(languageCode),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}
