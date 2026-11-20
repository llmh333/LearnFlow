import { apiFetch } from './client'
import type { LevelCount, PageResponse, WordDetail, WordSummary } from '@/types/domain'

export interface SearchWordsParams {
  lang: string
  q?: string
  level?: string
  page?: number
  size?: number
}

/**
 * Search dictionary words with language code, optional text, level filter and pagination.
 * Path: GET /api/v1/dictionary/words?lang=...
 */
export function fetchWords(params: SearchWordsParams): Promise<PageResponse<WordSummary>> {
  const query = new URLSearchParams()
  if (params.lang) query.set('lang', params.lang)
  if (params.q?.trim()) query.set('q', params.q.trim())
  if (params.level?.trim()) query.set('level', params.level.trim())
  if (params.page !== undefined && params.page >= 0) query.set('page', String(params.page))
  if (params.size !== undefined && params.size > 0) query.set('size', String(params.size))

  const queryString = query.toString()
  return apiFetch<PageResponse<WordSummary>>(
    `/dictionary/words${queryString ? `?${queryString}` : ''}`,
  )
}

/**
 * Fetch detailed word information including example sentences and licence source.
 * Path: GET /api/v1/dictionary/words/{id}
 */
export function fetchWordDetail(id: number): Promise<WordDetail> {
  return apiFetch<WordDetail>(`/dictionary/words/${id}`)
}

/**
 * Fetch total word counts grouped by level for a language.
 * Path: GET /api/v1/dictionary/levels?lang=...
 */
export function fetchLevelCounts(lang: string): Promise<LevelCount[]> {
  const query = new URLSearchParams()
  if (lang) query.set('lang', lang)
  const queryString = query.toString()
  return apiFetch<LevelCount[]>(`/dictionary/levels${queryString ? `?${queryString}` : ''}`)
}
