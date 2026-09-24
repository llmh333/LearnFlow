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

/**
 * The caller's most recent not-yet-ended session, if any — null on a 204 response. Resolves to
 * null rather than undefined because TanStack Query v5 treats a queryFn resolving to undefined as
 * an error.
 */
export async function fetchActiveStudySession(languageCode?: string): Promise<StudySession | null> {
  const qs = languageCode ? `?language=${encodeURIComponent(languageCode)}` : ''
  const result = await apiFetch<StudySession | undefined>(`/study-sessions/active${qs}`)
  return result ?? null
}
