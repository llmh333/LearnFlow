import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AiTutorPage } from './AiTutorPage'
import { ApiError } from '@/api/client'

vi.mock('@/api/ai', () => ({
  fetchScenarios: vi.fn(() =>
    Promise.resolve([{ code: 'cafe', label: '☕ Ordering Coffee & Breakfast' }]),
  ),
  listConversations: vi.fn(() => Promise.resolve([])),
  fetchConversation: vi.fn(() => Promise.resolve(null)),
  sendConversationMessage: vi.fn(),
  streamConversationMessage: vi.fn(),
  explainGrammar: vi.fn(),
  generateExamples: vi.fn(),
  correctSentence: vi.fn(),
  endConversation: vi.fn(),
}))

vi.mock('@/api/account', () => ({
  fetchProfile: vi.fn(() =>
    Promise.resolve({
      timezone: 'Asia/Ho_Chi_Minh',
      goal: 'JLPT',
      dailyMinutes: 10,
      dailyNewItems: 10,
    }),
  ),
}))

function renderAiTutorPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/ai-tutor']}>
        <AiTutorPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AiTutorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders chat tab and scenario chips by default', async () => {
    renderAiTutorPage()

    expect(screen.getByText('AI Conversation')).toBeInTheDocument()
    expect(await screen.findByText(/☕ Trò chuyện tự do/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Type your message/i)).toBeInTheDocument()
  })

  it('displays 429 quota exceeded notice when AI call rejects with 429', async () => {
    const { sendConversationMessage } = await import('@/api/ai')
    vi.mocked(sendConversationMessage).mockRejectedValueOnce(
      new ApiError(
        429,
        'Daily AI limit of 50 requests reached. It resets at midnight in your time zone.',
      ),
    )

    renderAiTutorPage()

    const input = await screen.findByPlaceholderText(/Type your message/i)
    fireEvent.change(input, { target: { value: 'Hello AI' } })

    const form = input.closest('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form!)

    // Check that the 429 notice appears with timezone and 50 calls limit
    const quotaNotice = await screen.findByTestId('ai-quota-exceeded-notice')
    expect(quotaNotice).toBeInTheDocument()
    expect(screen.getByText(/Đã dùng hết lượt AI hôm nay/i)).toBeInTheDocument()
    expect(screen.getByText(/50 lượt gọi AI/i)).toBeInTheDocument()
    expect(screen.getByText(/Asia\/Ho_Chi_Minh/i)).toBeInTheDocument()

    // And input form shows quota reached warning
    expect(
      screen.getByText(/Đã hết lượt gọi AI hôm nay \(tối đa 50 lượt\/ngày\)/i),
    ).toBeInTheDocument()
  })

  it('displays 429 notice in grammar tab when explain grammar rejects with 429', async () => {
    const { explainGrammar } = await import('@/api/ai')
    vi.mocked(explainGrammar).mockRejectedValueOnce(
      new ApiError(
        429,
        'Daily AI limit of 50 requests reached. It resets at midnight in your time zone.',
      ),
    )

    renderAiTutorPage()

    // Switch to Grammar tab
    const grammarTab = screen.getByText('Grammar Clinic')
    fireEvent.click(grammarTab)

    expect(await screen.findByText('Grammar Clinic & Guide')).toBeInTheDocument()

    const askInput = screen.getByPlaceholderText(/When should I use/i)
    fireEvent.change(askInput, { target: { value: 'Explain wa vs ga' } })

    const form = askInput.closest('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form!)

    const quotaNotice = await screen.findByTestId('ai-quota-exceeded-notice')
    expect(quotaNotice).toBeInTheDocument()
    expect(screen.getByText(/Đã dùng hết lượt AI hôm nay/i)).toBeInTheDocument()
  })
})
