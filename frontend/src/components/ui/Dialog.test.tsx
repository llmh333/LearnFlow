import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Dialog } from './Dialog'

describe('Dialog', () => {
  it('renders into document.body when open and cleans up on close', () => {
    const handleClose = vi.fn()
    const { unmount } = render(
      <Dialog open={true} onClose={handleClose} title="Test Title">
        <p>Modal Content</p>
      </Dialog>,
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Modal Content')).toBeInTheDocument()
    expect(document.body.style.overflow).toBe('hidden')

    unmount()
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('renders nothing when open is false', () => {
    render(
      <Dialog open={false} onClose={vi.fn()} title="Test Title">
        <p>Modal Content</p>
      </Dialog>,
    )

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument()
  })

  it('calls onClose when clicking close button or pressing Escape', () => {
    const handleClose = vi.fn()
    render(
      <Dialog open={true} onClose={handleClose} title="Test Title">
        <p>Modal Content</p>
      </Dialog>,
    )

    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(handleClose).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(2)
  })

  it('calls onClose when clicking the backdrop but not the modal content', () => {
    const handleClose = vi.fn()
    render(
      <Dialog open={true} onClose={handleClose} title="Test Title">
        <button type="button">Inside Button</button>
      </Dialog>,
    )

    // Click inside modal content
    fireEvent.click(screen.getByRole('button', { name: /inside button/i }))
    expect(handleClose).not.toHaveBeenCalled()

    // Click backdrop
    const modalContent = screen.getByText('Test Title').closest('.relative')
    const backdrop = modalContent?.parentElement
    expect(backdrop).toBeInTheDocument()
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(handleClose).toHaveBeenCalledTimes(1)
    }
  })
})
