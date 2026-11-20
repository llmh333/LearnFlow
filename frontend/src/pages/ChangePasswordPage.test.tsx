import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ChangePasswordPage } from './ChangePasswordPage'
import { ApiError } from '@/api/client'
import { useAuthStore } from '@/stores/authStore'

vi.mock('@/api/auth', () => ({
  changePassword: vi.fn(),
}))

function renderChangePasswordPage() {
  return render(
    <MemoryRouter initialEntries={['/change-password']}>
      <Routes>
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/ai-tutor" element={<div>AI Tutor Playground</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      token: 'old-access-token',
      user: { id: 1, email: 'user@example.com', displayName: 'Learner' },
      status: 'authenticated',
    })
  })

  it('renders change password page header and fields', () => {
    renderChangePasswordPage()

    expect(screen.getByText('Đổi mật khẩu tài khoản')).toBeInTheDocument()
    expect(screen.getByText('Mật khẩu hiện tại')).toBeInTheDocument()
    expect(screen.getByText('Mật khẩu mới')).toBeInTheDocument()
    expect(screen.getByText('Xác nhận mật khẩu mới')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Xác nhận đổi mật khẩu/i })).toBeInTheDocument()
  })

  it('validates password requirements and mismatch', async () => {
    renderChangePasswordPage()

    const submitBtn = screen.getByRole('button', { name: /Xác nhận đổi mật khẩu/i })
    fireEvent.click(submitBtn)

    expect(await screen.findByText('Vui lòng nhập mật khẩu hiện tại của bạn')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng nhập mật khẩu mới')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng xác nhận lại mật khẩu mới')).toBeInTheDocument()

    // Test mismatched passwords
    const newPassInput = screen.getByPlaceholderText(/Tối thiểu 8 ký tự/i)
    const confirmPassInput = screen.getByPlaceholderText(/Nhập lại mật khẩu mới/i)

    fireEvent.change(newPassInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPassInput, { target: { value: 'password456' } })
    fireEvent.click(submitBtn)

    expect(await screen.findByText('Mật khẩu xác nhận không trùng khớp')).toBeInTheDocument()
  })

  it('submits valid data, calls API, updates auth store, and displays success', async () => {
    const { changePassword } = await import('@/api/auth')
    vi.mocked(changePassword).mockResolvedValueOnce({
      token: 'new-refreshed-token',
      expiresAt: '2026-11-21T00:00:00Z',
      user: { id: 1, email: 'user@example.com', displayName: 'Learner' },
    })

    renderChangePasswordPage()

    const currentPassInput = screen.getByPlaceholderText(/Nhập mật khẩu hiện tại/i)
    const newPassInput = screen.getByPlaceholderText(/Tối thiểu 8 ký tự/i)
    const confirmPassInput = screen.getByPlaceholderText(/Nhập lại mật khẩu mới/i)
    const submitBtn = screen.getByRole('button', { name: /Xác nhận đổi mật khẩu/i })

    fireEvent.change(currentPassInput, { target: { value: 'oldPassword123' } })
    fireEvent.change(newPassInput, { target: { value: 'newPassword456' } })
    fireEvent.change(confirmPassInput, { target: { value: 'newPassword456' } })

    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(changePassword).toHaveBeenCalledWith({
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
        confirmNewPassword: 'newPassword456',
      })
    })

    expect(await screen.findByText('Đổi mật khẩu thành công!')).toBeInTheDocument()
    expect(useAuthStore.getState().token).toBe('new-refreshed-token')
  })

  it('maps backend field errors to form fields', async () => {
    const { changePassword } = await import('@/api/auth')
    vi.mocked(changePassword).mockRejectedValueOnce(
      new ApiError(400, 'Validation failed', {
        currentPassword: 'Mật khẩu hiện tại không chính xác',
      }),
    )

    renderChangePasswordPage()

    const currentPassInput = screen.getByPlaceholderText(/Nhập mật khẩu hiện tại/i)
    const newPassInput = screen.getByPlaceholderText(/Tối thiểu 8 ký tự/i)
    const confirmPassInput = screen.getByPlaceholderText(/Nhập lại mật khẩu mới/i)
    const submitBtn = screen.getByRole('button', { name: /Xác nhận đổi mật khẩu/i })

    fireEvent.change(currentPassInput, { target: { value: 'wrongOldPass1' } })
    fireEvent.change(newPassInput, { target: { value: 'newPassword456' } })
    fireEvent.change(confirmPassInput, { target: { value: 'newPassword456' } })

    fireEvent.click(submitBtn)

    expect(await screen.findByText('Mật khẩu hiện tại không chính xác')).toBeInTheDocument()
  })
})
