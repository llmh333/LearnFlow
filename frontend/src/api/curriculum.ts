import { apiFetch } from './client'
import type { ContentSource } from '@/types/domain'

export function fetchContentSources(): Promise<ContentSource[]> {
  return apiFetch<ContentSource[]>('/curriculum/sources')
}
