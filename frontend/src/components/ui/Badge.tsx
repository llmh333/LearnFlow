import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type BadgeProps = HTMLAttributes<HTMLSpanElement>

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
        className,
      )}
      {...props}
    />
  )
}
