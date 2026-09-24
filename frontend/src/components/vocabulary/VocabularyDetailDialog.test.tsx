import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VocabularyDetailDialog } from './VocabularyDetailDialog'
import type { Vocabulary } from '@/types/domain'

const chineseWord: Vocabulary = {
  id: 1,
  language: { id: 2, code: 'zh', name: 'Chinese' },
  word: '学习',
  meaning: 'học / học tập',
  example: '我每天学习中文。',
  difficulty: 1,
  tags: ['HSK1'],
  attributes: { pinyin: 'xué xí' },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const englishWord: Vocabulary = {
  id: 2,
  language: { id: 1, code: 'en', name: 'English' },
  word: 'achieve',
  meaning: 'đạt được',
  example: 'I want to achieve my goals.',
  difficulty: 1,
  tags: [],
  attributes: { ipa: 'əˈtʃiːv' },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('VocabularyDetailDialog', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValue({ ok: false })
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('shows meaning, phonetic, example and a stroke-order guide for a zh/ja word', async () => {
    render(<VocabularyDetailDialog vocabulary={chineseWord} onClose={vi.fn()} />)

    expect(screen.getByText('学习')).toBeInTheDocument()
    expect(screen.getByText('xué xí')).toBeInTheDocument()
    expect(screen.getByText('học / học tập')).toBeInTheDocument()
    expect(screen.getByText('"我每天学习中文。"')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(/AnimCJK/i)).toBeInTheDocument())
  })

  it('does not show a stroke-order guide for an English word', () => {
    render(<VocabularyDetailDialog vocabulary={englishWord} onClose={vi.fn()} />)

    expect(screen.getByText('achieve')).toBeInTheDocument()
    expect(screen.getByText('/əˈtʃiːv/')).toBeInTheDocument()
    expect(screen.queryByText(/AnimCJK/i)).not.toBeInTheDocument()
  })

  it('renders nothing when there is no vocabulary to show', () => {
    render(<VocabularyDetailDialog vocabulary={null} onClose={vi.fn()} />)

    expect(screen.queryByText('achieve')).not.toBeInTheDocument()
  })
})
