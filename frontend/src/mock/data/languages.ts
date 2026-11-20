import type { Language } from '@/types/domain'

/** Mirrors backend /api/v1/languages which only returns enabled languages (currently 'ja'). */
export const MOCK_LANGUAGES: Language[] = [
  { id: 1, code: 'ja', name: 'Japanese (Tiếng Nhật / 日本語)' },
]
