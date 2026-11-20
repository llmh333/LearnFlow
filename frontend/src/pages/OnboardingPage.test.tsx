import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OnboardingPage } from './OnboardingPage'
import { useUiStore } from '@/stores/uiStore'

vi.mock('@/hooks/useAccount', () => ({
  useProfile: () => ({
    data: {
      timezone: 'Asia/Ho_Chi_Minh',
      goal: null,
      dailyMinutes: 10,
      dailyNewItems: 10,
      onboardedAt: null,
    },
    isLoading: false,
  }),
  useUpdateProfile: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
  }),
}))

function renderOnboarding() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/onboarding']}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/ai-tutor" element={<div>AI Tutor Playground Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    useUiStore.setState({
      selectedLanguageCode: 'en',
      userLevels: { en: 'B1', zh: 'HSK 2', ja: 'N5' },
      isOnboarded: false,
    })
  })

  it('renders Step 1 with 3 language choices and proceeds to Step 2', () => {
    renderOnboarding()

    expect(screen.getByText('Bạn muốn chinh phục ngôn ngữ nào?')).toBeInTheDocument()
    expect(screen.getByText('English (Tiếng Anh)')).toBeInTheDocument()
    expect(screen.getByText('Chinese (Tiếng Trung)')).toBeInTheDocument()
    expect(screen.getByText('Japanese (Tiếng Nhật)')).toBeInTheDocument()

    // Click Japanese
    fireEvent.click(screen.getByText('Japanese (Tiếng Nhật)'))

    // Click "Tiếp Tục"
    fireEvent.click(screen.getByRole('button', { name: /tiếp tục/i }))

    // Now in Step 2: Levels for Japanese
    expect(screen.getByText(/trình độ japanese của bạn\?/i)).toBeInTheDocument()
    expect(screen.getByText('JLPT N5 - Nhập môn')).toBeInTheDocument()
    expect(screen.getByText('JLPT N4 - Sơ cấp')).toBeInTheDocument()
  })

  it('navigates through full wizard to celebration and finishes onboarding', async () => {
    renderOnboarding()

    // Step 1 -> Step 2
    fireEvent.click(screen.getByRole('button', { name: /tiếp tục/i }))

    // Step 2 -> Step 3
    fireEvent.click(screen.getByRole('button', { name: /tiếp tục/i }))
    expect(screen.getByText(/mục tiêu chính khi học của bạn là gì\?/i)).toBeInTheDocument()

    // Step 3 -> Step 4
    fireEvent.click(screen.getByRole('button', { name: /tiếp tục/i }))
    expect(screen.getByText(/bạn muốn dành bao nhiêu phút mỗi ngày\?/i)).toBeInTheDocument()

    // Step 4 -> Step 5
    fireEvent.click(screen.getByRole('button', { name: /tiếp tục/i }))
    expect(screen.getByText(/chào mừng bạn đến với learnflow!/i)).toBeInTheDocument()

    // Step 5: Finish
    const finishBtn = screen.getByRole('button', { name: /bắt đầu học ngay!/i })
    fireEvent.click(finishBtn)

    expect(useUiStore.getState().isOnboarded).toBe(true)
    expect(await screen.findByText('AI Tutor Playground Page')).toBeInTheDocument()
  })
})
