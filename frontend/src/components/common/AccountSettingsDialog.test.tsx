import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountSettingsDialog } from './AccountSettingsDialog'
import { useAuthStore } from '@/stores/authStore'

const updateUserSettings = vi.fn()

vi.mock('@/api/auth', () => ({
  updateUserSettings: (...args: unknown[]) => updateUserSettings(...args),
}))

function renderDialog(onClose: () => void) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <AccountSettingsDialog open onClose={onClose} />
    </QueryClientProvider>,
  )
}

describe('AccountSettingsDialog', () => {
  beforeEach(() => {
    updateUserSettings.mockReset()
    useAuthStore.setState({
      token: 'fake-token',
      user: { id: 1, email: 'user@example.com', displayName: 'User', dailyNewWordsLimit: 20 },
    })
  })

  it('shows the current daily new-words limit and saves a changed value', async () => {
    updateUserSettings.mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      displayName: 'User',
      dailyNewWordsLimit: 30,
    })
    const onClose = vi.fn()
    renderDialog(onClose)

    expect(screen.getByRole('combobox')).toHaveValue('20')

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '30' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(updateUserSettings).toHaveBeenCalledWith(
        { dailyNewWordsLimit: 30 },
        expect.anything(),
      ),
    )
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(useAuthStore.getState().user?.dailyNewWordsLimit).toBe(30)
  })

  it('closes without saving when Cancel is clicked', () => {
    const onClose = vi.fn()
    renderDialog(onClose)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onClose).toHaveBeenCalled()
    expect(updateUserSettings).not.toHaveBeenCalled()
  })
})
