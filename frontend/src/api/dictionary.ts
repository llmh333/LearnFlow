import { apiFetch } from './client'
import type { LevelCount, PageResponse, WordDetail, WordSummary } from '@/types/domain'

export interface SearchWordsParams {
  q?: string
  level?: string
  page?: number
  size?: number
}

/**
 * Search Japanese dictionary words with optional text, JLPT level filter and pagination.
 * Path: GET /api/v1/dictionary/words
 */
export function fetchWords(params: SearchWordsParams = {}): Promise<PageResponse<WordSummary>> {
  const query = new URLSearchParams()
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
 * Fetch total word counts grouped by JLPT level (N5 -> N1).
 * Path: GET /api/v1/dictionary/levels
 */
export function fetchLevelCounts(): Promise<LevelCount[]> {
  return apiFetch<LevelCount[]>('/dictionary/levels')
}
