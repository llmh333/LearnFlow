import { apiFetch } from './client'
import type { Language } from '@/types/domain'

export function fetchLanguages(): Promise<Language[]> {
  return apiFetch<Language[]>('/languages')
}
