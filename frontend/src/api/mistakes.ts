import { apiFetch } from './client'
import type { Language } from '@/types/domain'

export interface Mistake {
  id: number
  language: Language | null
  vocabularyId: number | null
  category: string | null
  topic: string | null
  original: string
  corrected: string
  explanation: string | null
  timesRepeated: number
  createdAt: string
}

export interface CreateMistakePayload {
  languageCode: string
  vocabularyId?: number | null
  category: string
  topic?: string | null
  original: string
  corrected: string
  explanation?: string | null
}

export function fetchMistakes(language?: string, category?: string): Promise<Mistake[]> {
  const params = new URLSearchParams()
  if (language) params.set('language', language)
  if (category) params.set('category', category)
  const qs = params.toString()
  return apiFetch<Mistake[]>(`/mistakes${qs ? `?${qs}` : ''}`)
}

export function fetchRecurringMistakes(language?: string, limit = 10): Promise<Mistake[]> {
  const params = new URLSearchParams()
  if (language) params.set('language', language)
  params.set('limit', String(limit))
  return apiFetch<Mistake[]>(`/mistakes/recurring?${params.toString()}`)
}

export function createMistake(payload: CreateMistakePayload): Promise<Mistake> {
  return apiFetch<Mistake>('/mistakes', { method: 'POST', body: JSON.stringify(payload) })
}

export function fetchMistakeCategories(): Promise<string[]> {
  return apiFetch<string[]>('/mistakes/categories')
}
