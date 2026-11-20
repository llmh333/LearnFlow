import { Flex } from 'antd'
import type { ReactNode } from 'react'
import { Flowy, IconCheck, IconLogOut, IconSparkles, IconTrash, IconZap } from '@/assets'
import { Button, type ButtonProps } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { cn } from '@/lib/cn'

export type ConfirmVariant = 'primary' | 'danger' | 'warning' | 'sky' | 'coral'
export type ConfirmIconType =
  'mascot' | 'success' | 'danger' | 'warning' | 'info' | 'trash' | 'logout'

export interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: ReactNode
  description?: ReactNode
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  icon?: ConfirmIconType | ReactNode
  isLoading?: boolean
  children?: ReactNode
  className?: string
}

/**
 * Common reusable Confirmation Modal for LearnFlow.
 * Adheres to tactile 3D Duolingo-inspired aesthetics with customizable variants, icons, and actions.
 */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  variant = 'primary',
  icon = 'mascot',
  isLoading = false,
  children,
  className,
}: ConfirmModalProps) {
  function renderIcon() {
    if (typeof icon !== 'string') {
      return icon
    }

    switch (icon) {
      case 'success':
        return (
          <Flex
            align="center"
            justify="center"
            className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-500 border-2 border-b-4 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400 shadow-sm"
          >
            <IconCheck size={32} />
          </Flex>
        )
      case 'danger':
      case 'trash':
        return (
          <Flex
            align="center"
            justify="center"
            className="h-16 w-16 rounded-2xl bg-rose-50 text-[#FF4B4B] border-2 border-b-4 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-400 shadow-sm"
          >
            <IconTrash size={30} />
          </Flex>
        )
      case 'logout':
        return (
          <Flex
            align="center"
            justify="center"
            className="h-16 w-16 rounded-2xl bg-rose-50 text-[#FF4B4B] border-2 border-b-4 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-400 shadow-sm"
          >
            <IconLogOut size={30} />
          </Flex>
        )
      case 'warning':
        return (
          <Flex
            align="center"
            justify="center"
            className="h-16 w-16 rounded-2xl bg-amber-50 text-amber-500 border-2 border-b-4 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400 shadow-sm"
          >
            <IconZap size={30} />
          </Flex>
        )
      case 'info':
        return (
          <Flex
            align="center"
            justify="center"
            className="h-16 w-16 rounded-2xl bg-sky-50 text-[#1CB0F6] border-2 border-b-4 border-sky-200 dark:bg-sky-950/40 dark:border-sky-800 dark:text-[#1CB0F6] shadow-sm"
          >
            <IconSparkles size={30} />
          </Flex>
        )
      case 'mascot':
      default:
        return (
          <Flex
            align="center"
            justify="center"
            className="h-16 w-16 rounded-2xl bg-white shadow-sm border-2 border-b-4 border-slate-200 dark:bg-[#131F24] dark:border-[#2B3940]"
          >
            <Flowy size={44} />
          </Flex>
        )
    }
  }

  const buttonVariant: ButtonProps['variant'] =
    variant === 'warning' ? 'yellow' : variant === 'coral' ? 'danger' : variant

  return (
    <Dialog
      open={open}
      onClose={isLoading ? () => {} : onClose}
      className={cn('max-w-md', className)}
    >
      <Flex vertical align="center" className="text-center">
        {/* Visual Badge */}
        <div className="mb-4">{renderIcon()}</div>

        {/* Title */}
        <h3 className="text-xl font-black text-slate-900 dark:text-white">{title}</h3>

        {/* Description */}
        {description && (
          <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm">
            {description}
          </p>
        )}

        {/* Optional Extra Content (Summary, fields, etc.) */}
        {children && <div className="mt-4 w-full text-left">{children}</div>}

        {/* Action Buttons */}
        <Flex className="mt-6 w-full flex-col-reverse gap-2.5 sm:flex-row sm:gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wide"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={buttonVariant}
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 text-xs font-extrabold uppercase tracking-wide"
          >
            {isLoading ? 'Đang xử lý…' : confirmText}
          </Button>
        </Flex>
      </Flex>
    </Dialog>
  )
}
