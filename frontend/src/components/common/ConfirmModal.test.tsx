import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmModal } from './ConfirmModal'
import { useConfirm } from '@/hooks/useConfirm'

describe('ConfirmModal', () => {
  it('renders title, description and children when open', () => {
    const handleClose = vi.fn()
    const handleConfirm = vi.fn()

    render(
      <ConfirmModal
        open={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Xác nhận đăng ký"
        description="Bạn có muốn tạo tài khoản không?"
      >
        <div data-testid="custom-child">Email: test@example.com</div>
      </ConfirmModal>,
    )

    expect(screen.getByText('Xác nhận đăng ký')).toBeInTheDocument()
    expect(screen.getByText('Bạn có muốn tạo tài khoản không?')).toBeInTheDocument()
    expect(screen.getByTestId('custom-child')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Xác nhận/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Hủy bỏ/i })).toBeInTheDocument()
  })

  it('does not render when open is false', () => {
    render(<ConfirmModal open={false} onClose={vi.fn()} onConfirm={vi.fn()} title="Hidden Modal" />)

    expect(screen.queryByText('Hidden Modal')).not.toBeInTheDocument()
  })

  it('triggers onConfirm when confirm button is clicked', () => {
    const handleConfirm = vi.fn()
    render(
      <ConfirmModal
        open={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        title="Confirm Action"
        confirmText="Đồng ý ngay"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Đồng ý ngay/i }))
    expect(handleConfirm).toHaveBeenCalledTimes(1)
  })

  it('triggers onClose when cancel button is clicked', () => {
    const handleClose = vi.fn()
    render(
      <ConfirmModal
        open={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
        title="Confirm Action"
        cancelText="Quay lại"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Quay lại/i }))
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('disables buttons and displays loading text when isLoading is true', () => {
    const handleConfirm = vi.fn()
    render(
      <ConfirmModal
        open={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        title="Processing"
        isLoading={true}
      />,
    )

    const confirmBtn = screen.getByRole('button', { name: /Đang xử lý/i })
    expect(confirmBtn).toBeDisabled()

    const cancelBtn = screen.getByRole('button', { name: /Hủy bỏ/i })
    expect(cancelBtn).toBeDisabled()
  })

  it('renders different icon types correctly', () => {
    const { rerender } = render(
      <ConfirmModal
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Icon Test"
        icon="danger"
      />,
    )
    expect(screen.getByText('Icon Test')).toBeInTheDocument()

    rerender(
      <ConfirmModal
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Icon Test"
        icon="success"
      />,
    )
    expect(screen.getByText('Icon Test')).toBeInTheDocument()

    rerender(
      <ConfirmModal
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Icon Test"
        icon="warning"
      />,
    )
    expect(screen.getByText('Icon Test')).toBeInTheDocument()
  })
})

describe('useConfirm hook', () => {
  function TestHookComponent({ onResult }: { onResult: (res: boolean) => void }) {
    const { confirm, ConfirmModal } = useConfirm()

    async function handleClick() {
      const ok = await confirm({
        title: 'Hook Test Title',
        description: 'Hook Test Desc',
        confirmText: 'Yes Please',
        cancelText: 'No Thanks',
      })
      onResult(ok)
    }

    return (
      <div>
        <button type="button" onClick={handleClick}>
          Trigger Confirm
        </button>
        {ConfirmModal}
      </div>
    )
  }

  it('resolves true on confirm', async () => {
    const handleResult = vi.fn()
    render(<TestHookComponent onResult={handleResult} />)

    fireEvent.click(screen.getByRole('button', { name: /Trigger Confirm/i }))
    expect(await screen.findByText('Hook Test Title')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Yes Please/i }))

    await waitFor(() => {
      expect(handleResult).toHaveBeenCalledWith(true)
    })
  })

  it('resolves false on cancel', async () => {
    const handleResult = vi.fn()
    render(<TestHookComponent onResult={handleResult} />)

    fireEvent.click(screen.getByRole('button', { name: /Trigger Confirm/i }))
    expect(await screen.findByText('Hook Test Title')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /No Thanks/i }))

    await waitFor(() => {
      expect(handleResult).toHaveBeenCalledWith(false)
    })
  })
})
