import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

describe('App', () => {
  it('shows a checking state before the health check resolves', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})), // never resolves within the test
    )

    render(<App />)

    expect(screen.getByText(/checking/i)).toBeInTheDocument()
  })
})
