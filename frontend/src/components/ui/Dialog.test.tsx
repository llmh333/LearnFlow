import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Dialog } from './Dialog'

describe('Dialog', () => {
  it('shows the title and content as an accessible dialog when open', () => {
    render(
      <Dialog open={true} onClose={vi.fn()} title="Test Title">
        <p>Modal Content</p>
      </Dialog>,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Modal Content')).toBeInTheDocument()
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

  it('calls onClose from the close button and from Escape', () => {
    const handleClose = vi.fn()
    render(
      <Dialog open={true} onClose={handleClose} title="Test Title">
        <button type="button">Inside Button</button>
      </Dialog>,
    )

    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(handleClose).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(2)
  })

  it('does not close when the content itself is clicked', () => {
    const handleClose = vi.fn()
    render(
      <Dialog open={true} onClose={handleClose} title="Test Title">
        <button type="button">Inside Button</button>
      </Dialog>,
    )

    fireEvent.click(screen.getByRole('button', { name: /inside button/i }))
    expect(handleClose).not.toHaveBeenCalled()
  })
})
