import { useMutation } from '@tanstack/react-query'
import * as studySessionsApi from '@/api/studySessions'

export function useStartStudySession() {
  return useMutation({ mutationFn: studySessionsApi.startStudySession })
}

export function useEndStudySession() {
  return useMutation({ mutationFn: studySessionsApi.endStudySession })
}
