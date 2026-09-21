import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900',
        className,
      )}
      {...props}
    />
  )
}
