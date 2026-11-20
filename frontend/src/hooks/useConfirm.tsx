import type { ReactNode } from 'react'
import { useCallback, useRef, useState } from 'react'
import {
  ConfirmModal,
  type ConfirmIconType,
  type ConfirmVariant,
} from '@/components/common/ConfirmModal'

export interface UseConfirmOptions {
  title: ReactNode
  description?: ReactNode
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  icon?: ConfirmIconType | ReactNode
  children?: ReactNode
}

/**
 * Imperative hook to trigger confirmation dialogs with Promise resolution:
 * const { confirm, ConfirmModal } = useConfirm();
 * const ok = await confirm({ title: '...', description: '...' });
 * if (ok) { ... }
 */
export function useConfirm() {
  const [state, setState] = useState<UseConfirmOptions & { open: boolean; isLoading?: boolean }>({
    open: false,
    title: '',
  })
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((options: UseConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
      setState({ ...options, open: true, isLoading: false })
    })
  }, [])

  const handleClose = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }))
    resolverRef.current?.(false)
    resolverRef.current = null
  }, [])

  const handleConfirm = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }))
    resolverRef.current?.(true)
    resolverRef.current = null
  }, [])

  const ConfirmModalComponent = (
    <ConfirmModal
      open={state.open}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={state.title}
      description={state.description}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      variant={state.variant}
      icon={state.icon}
      isLoading={state.isLoading}
    >
      {state.children}
    </ConfirmModal>
  )

  return {
    confirm,
    ConfirmModal: ConfirmModalComponent,
    isOpen: state.open,
    close: handleClose,
  }
}
