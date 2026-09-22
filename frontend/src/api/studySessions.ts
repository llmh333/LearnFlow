import { apiFetch } from './client'
import type { StudySession } from '@/types/domain'

export function startStudySession(languageCode?: string): Promise<StudySession> {
  return apiFetch<StudySession>('/study-sessions/start', {
    method: 'POST',
    body: JSON.stringify({ languageCode: languageCode ?? null }),
  })
}

export function endStudySession(id: number): Promise<StudySession> {
  return apiFetch<StudySession>(`/study-sessions/${id}/end`, { method: 'POST' })
}
