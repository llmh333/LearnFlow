import { apiFetch } from './client'
import type { PageResponse, Vocabulary } from '@/types/domain'

export interface VocabularyListParams {
  language?: string
  search?: string
  tag?: string
  page?: number
  size?: number
}

export interface VocabularyPayload {
  languageCode: string
  word: string
  meaning: string
  example?: string | null
  difficulty?: number
  tags?: string[]
  attributes?: Record<string, unknown>
}

function buildQuery(params: VocabularyListParams): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value))
    }
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export function fetchVocabularyList(
  params: VocabularyListParams,
): Promise<PageResponse<Vocabulary>> {
  return apiFetch<PageResponse<Vocabulary>>(`/vocabulary${buildQuery(params)}`)
}

export function fetchVocabulary(id: number): Promise<Vocabulary> {
  return apiFetch<Vocabulary>(`/vocabulary/${id}`)
}

export function createVocabulary(payload: VocabularyPayload): Promise<Vocabulary> {
  return apiFetch<Vocabulary>('/vocabulary', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateVocabulary(id: number, payload: VocabularyPayload): Promise<Vocabulary> {
  return apiFetch<Vocabulary>(`/vocabulary/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteVocabulary(id: number): Promise<void> {
  return apiFetch<void>(`/vocabulary/${id}`, { method: 'DELETE' })
}

export function fetchVocabularyTags(): Promise<string[]> {
  return apiFetch<string[]>('/vocabulary/tags')
}
