import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { cn } from '@/lib/cn'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

/** A minimal modal — no portal library, per "no dependency outside the decided list" (§1.5). */
export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  useEffect(() => {
    if (!open) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full max-w-lg rounded-lg bg-white p-6 shadow-lg dark:bg-neutral-900',
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {title && (
          <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  )
}
