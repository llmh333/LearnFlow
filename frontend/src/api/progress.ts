import { apiFetch } from './client'
import type { ProgressSummary, Retention, StudySession, WeakArea } from '@/types/domain'

export function fetchProgressSummary(language?: string): Promise<ProgressSummary> {
  return apiFetch<ProgressSummary>(`/progress/summary${language ? `?language=${language}` : ''}`)
}

export function fetchRetention(language: string | undefined, days = 30): Promise<Retention> {
  const params = new URLSearchParams()
  if (language) params.set('language', language)
  params.set('days', String(days))
  return apiFetch<Retention>(`/progress/retention?${params.toString()}`)
}

export function fetchWeakAreas(language: string | undefined, limit = 10): Promise<WeakArea[]> {
  const params = new URLSearchParams()
  if (language) params.set('language', language)
  params.set('limit', String(limit))
  return apiFetch<WeakArea[]>(`/progress/weak-areas?${params.toString()}`)
}

export function fetchProgressHistory(language?: string): Promise<StudySession[]> {
  return apiFetch<StudySession[]>(`/progress/history${language ? `?language=${language}` : ''}`)
}
