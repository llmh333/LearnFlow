import { Modal } from 'antd'
import type { ReactNode } from 'react'
import { IconX } from '@/assets'
import { cn } from '@/lib/cn'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * The app's modal: antd Modal (focus trap, Escape, scroll lock, aria) in the LearnFlow 3D card
 * style. `className` lands on the modal box, e.g. `max-w-md` for a narrower dialog.
 */
export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={title}
      footer={null}
      centered
      destroyOnHidden
      width={512}
      closeIcon={<IconX size={18} />}
      className={cn('max-w-[calc(100vw-2rem)]', className)}
      classNames={{
        container:
          'rounded-3xl border-2 border-b-4 border-slate-200 p-6 shadow-2xl dark:border-[#2B3940] dark:bg-[#1A262C]',
        header: 'mb-5 bg-transparent',
        title: 'text-xl font-black text-slate-900 dark:text-slate-100',
        mask: 'backdrop-blur-xs',
      }}
    >
      {children}
    </Modal>
  )
}
