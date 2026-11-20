import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VocabularyPage } from './VocabularyPage'

const MOCK_LEVELS = [
  { level: 'N5', wordCount: 718 },
  { level: 'N4', wordCount: 630 },
]

const MOCK_WORDS_PAGE = {
  content: [
    {
      id: 1,
      written: '学生',
      reading: 'がくせい',
      meaningsVi: ['học sinh', 'sinh viên'],
      partOfSpeech: ['n'],
      jlptLevel: 'N5',
    },
    {
      id: 2,
      written: '先生',
      reading: 'せんせい',
      meaningsVi: ['thầy giáo', 'cô giáo'],
      partOfSpeech: ['n'],
      jlptLevel: 'N5',
    },
    {
      id: 3,
      written: '案内する',
      reading: 'あんないする',
      meaningsVi: ['hướng dẫn', 'dẫn đường'],
      partOfSpeech: ['vs'],
      jlptLevel: 'N4',
    },
  ],
  page: 0,
  size: 20,
  totalElements: 3,
  totalPages: 1,
}

const MOCK_WORD_DETAIL = {
  id: 1,
  written: '学生',
  reading: 'がくせい',
  meaningsVi: ['học sinh', 'sinh viên'],
  meaningsEn: ['student'],
  partOfSpeech: ['n'],
  jlptLevel: 'N5',
  note: 'Thường dùng cho học sinh cấp 3 và sinh viên đại học.',
  examples: [
    {
      text: '私は大学の学生です。',
      reading: 'わたしはだいがくのがくせいです。',
      translationVi: 'Tôi là sinh viên đại học.',
      sourceAuthor: 'LearnFlow Core',
    },
  ],
  source: {
    key: 'jmdict',
    name: 'JMdict (EDRDG)',
    url: 'https://www.edrdg.org/jmdict/j_jmdict.html',
    license: 'CC BY-SA 4.0',
    attribution: 'Electronic Dictionary Research and Development Group',
  },
}

vi.mock('@/components/review/WordStrokeOrder', () => ({
  WordStrokeOrder: () => <div data-testid="word-stroke-order">Stroke Order Mock</div>,
}))

vi.mock('@/api/dictionary', () => ({
  fetchLevelCounts: vi.fn(() => Promise.resolve(MOCK_LEVELS)),
  fetchWords: vi.fn(() => Promise.resolve(MOCK_WORDS_PAGE)),
  fetchWordDetail: vi.fn((id: number) => Promise.resolve({ ...MOCK_WORD_DETAIL, id })),
}))

function renderVocabularyPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/vocabulary']}>
        <Routes>
          <Route path="/vocabulary" element={<VocabularyPage />} />
          <Route path="/ai-tutor" element={<div>AI Tutor Playground</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('VocabularyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders vocabulary studio header, level tabs and word cards', async () => {
    renderVocabularyPage()

    expect(screen.getByText('Thư viện Từ vựng JLPT')).toBeInTheDocument()
    expect(await screen.findByText('学生')).toBeInTheDocument()
    expect(screen.getByText('先生')).toBeInTheDocument()
    expect(screen.getByText('học sinh, sinh viên')).toBeInTheDocument()
    expect(screen.getAllByText('N5').length).toBeGreaterThan(0)
  })

  it('allows toggling between card view and table view', async () => {
    renderVocabularyPage()

    expect(await screen.findByText('学生')).toBeInTheDocument()

    // Click "Bảng tra"
    const tableViewBtn = screen.getByText('Bảng tra')
    fireEvent.click(tableViewBtn)

    // Table headers should appear
    expect(screen.getByText('Từ vựng (Chữ viết / Cách đọc)')).toBeInTheDocument()
    expect(screen.getByText('Ý nghĩa tiếng Việt')).toBeInTheDocument()
  })

  it('opens word detail modal when clicking a word card', async () => {
    renderVocabularyPage()

    const wordCard = await screen.findByText('学生')
    fireEvent.click(wordCard)

    // Modal opens and shows detail
    expect(await screen.findByText('Phiên âm Kana: がくせい')).toBeInTheDocument()
    expect(
      screen.getByText('Thường dùng cho học sinh cấp 3 và sinh viên đại học.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Tôi là sinh viên đại học.')).toBeInTheDocument()
    expect(screen.getByText(/Nguồn dữ liệu:/)).toBeInTheDocument()
  })

  it('triggers search and level filter', async () => {
    const { fetchWords } = await import('@/api/dictionary')
    renderVocabularyPage()

    const searchInput = screen.getByPlaceholderText(/nhập chữ hán/i)
    fireEvent.change(searchInput, { target: { value: 'ngủ' } })
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(fetchWords).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'ngủ',
        }),
      )
    })

    // Click N4 filter
    const n4Button = screen.getByRole('radio', { name: /N4/i })
    fireEvent.click(n4Button)

    await waitFor(() => {
      expect(fetchWords).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'N4',
        }),
      )
    })
  })
})
