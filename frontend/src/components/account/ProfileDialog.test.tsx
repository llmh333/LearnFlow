import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ProfileDialog } from './ProfileDialog'

const updateProfile = vi.fn()

vi.mock('@/api/account', () => ({
  fetchProfile: () =>
    Promise.resolve({
      timezone: 'Asia/Ho_Chi_Minh',
      goal: null,
      dailyMinutes: 10,
      dailyNewItems: 10,
      onboardedAt: null,
    }),
  updateProfile: (...args: unknown[]) => updateProfile(...args),
}))

function renderDialog(onClose = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ProfileDialog open onClose={onClose} />
      </QueryClientProvider>
    </MemoryRouter>,
  )
  return onClose
}

async function choose(label: string, option: string) {
  fireEvent.mouseDown(screen.getByLabelText(label))
  const items = await screen.findAllByTitle(option)
  fireEvent.click(items[items.length - 1])
}

describe('ProfileDialog', () => {
  it('shows the saved profile and sends the changed values', async () => {
    updateProfile.mockResolvedValue({
      timezone: 'Asia/Ho_Chi_Minh',
      goal: 'JLPT',
      dailyMinutes: 15,
      dailyNewItems: 10,
      onboardedAt: null,
    })
    const onClose = renderDialog()

    // antd Select shows the chosen option as text; pick new ones from the opened dropdown.
    expect(await screen.findByText('Asia/Ho_Chi_Minh')).toBeInTheDocument()
    await choose('Goal', 'Pass the JLPT')
    await choose('Minutes per day', '15 minutes')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(updateProfile.mock.calls[0][0]).toEqual({
      timezone: 'Asia/Ho_Chi_Minh',
      goal: 'JLPT',
      dailyMinutes: 15,
      dailyNewItems: 10,
    })
  })
})
