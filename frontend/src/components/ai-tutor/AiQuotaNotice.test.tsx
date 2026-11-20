import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AiQuotaNotice } from './AiQuotaNotice'
import { ApiError } from '@/api/client'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('AiQuotaNotice', () => {
  it('renders nothing when there is no error', () => {
    const { container } = render(
      <MemoryRouter>
        <AiQuotaNotice error={null} />
      </MemoryRouter>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders regular error alert for generic non-429 error', () => {
    render(
      <MemoryRouter>
        <AiQuotaNotice error={new ApiError(500, 'Internal Server Error')} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Internal Server Error')).toBeInTheDocument()
    expect(screen.queryByTestId('ai-quota-exceeded-notice')).not.toBeInTheDocument()
  })

  it('renders rich 429 quota notice with timezone and study alternatives', () => {
    const onOpenProfile = vi.fn()
    const quotaError = new ApiError(
      429,
      'Daily AI limit of 50 requests reached. It resets at midnight in your time zone.',
    )

    render(
      <MemoryRouter>
        <AiQuotaNotice
          error={quotaError}
          userTimezone="Asia/Ho_Chi_Minh"
          onOpenProfile={onOpenProfile}
        />
      </MemoryRouter>,
    )

    const notice = screen.getByTestId('ai-quota-exceeded-notice')
    expect(notice).toBeInTheDocument()
    expect(screen.getByText(/Đã dùng hết lượt AI hôm nay/i)).toBeInTheDocument()
    expect(screen.getByText(/50 lượt gọi AI/i)).toBeInTheDocument()
    expect(screen.getByText(/00:00 \(nửa đêm\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Asia\/Ho_Chi_Minh/i)).toBeInTheDocument()

    // Vocabulary CTA button
    const vocabBtn = screen.getByRole('button', { name: /Ôn tập Từ vựng JLPT/i })
    fireEvent.click(vocabBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/vocabulary')

    // Profile timezone button
    const profileBtn = screen.getByRole('button', { name: /Xem múi giờ tài khoản/i })
    fireEvent.click(profileBtn)
    expect(onOpenProfile).toHaveBeenCalled()
  })
})
