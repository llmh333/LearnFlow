import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { ForgotPasswordPage } from './ForgotPasswordPage'

const requestPasswordReset = vi.fn()
const verifyPasswordReset = vi.fn()
const confirmPasswordReset = vi.fn()

vi.mock('@/api/auth', () => ({
  requestPasswordReset: (...args: unknown[]) => requestPasswordReset(...args),
  verifyPasswordReset: (...args: unknown[]) => verifyPasswordReset(...args),
  confirmPasswordReset: (...args: unknown[]) => confirmPasswordReset(...args),
}))

function LoginStub() {
  const state = useLocation().state as { passwordReset?: boolean } | null
  return <div>Login page {state?.passwordReset ? '(reset done)' : ''}</div>
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/login" element={<LoginStub />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

async function goToPasswordStep() {
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: 'user@example.com' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Send code' }))
  expect(await screen.findByText(/we have sent a code/i)).toBeInTheDocument()

  const digits = screen.getAllByRole('textbox')
  '123456'.split('').forEach((digit, i) => fireEvent.input(digits[i], { target: { value: digit } }))
  fireEvent.click(screen.getByRole('button', { name: 'Verify code' }))
  expect(await screen.findByLabelText('New password')).toBeInTheDocument()
}

function submitNewPassword() {
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpassword1' } })
  fireEvent.change(screen.getByLabelText('Confirm new password'), {
    target: { value: 'newpassword1' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Set new password' }))
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requestPasswordReset.mockResolvedValue(undefined)
    verifyPasswordReset.mockResolvedValue(undefined)
  })

  it('walks email → code → new password, then sends the user to log in', async () => {
    confirmPasswordReset.mockResolvedValue(undefined)
    renderPage()

    await goToPasswordStep()
    expect(requestPasswordReset).toHaveBeenCalledWith('user@example.com')
    expect(verifyPasswordReset).toHaveBeenCalledWith('user@example.com', '123456')
    submitNewPassword()

    expect(await screen.findByText(/login page \(reset done\)/i)).toBeInTheDocument()
    expect(confirmPasswordReset).toHaveBeenCalledWith({
      email: 'user@example.com',
      code: '123456',
      newPassword: 'newpassword1',
      confirmNewPassword: 'newpassword1',
    })
  })

  it('locks "Resend code" for 60 seconds after sending', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send code' }))

    expect(await screen.findByRole('button', { name: /resend code in 60s/i })).toBeDisabled()
  })

  it('goes back to the code step when the code expired while typing the password', async () => {
    confirmPasswordReset.mockRejectedValue(
      new ApiError(400, 'Validation failed', { code: 'Invalid or expired code' }),
    )
    renderPage()

    await goToPasswordStep()
    submitNewPassword()

    expect(await screen.findByText(/invalid or expired code/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Verify code' })).toBeVisible())
  })
})
