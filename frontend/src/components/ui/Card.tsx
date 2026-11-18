import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

export function Card({ className, hoverable = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 dark:border-slate-800 dark:bg-slate-900/90',
        hoverable &&
          'hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/40',
        className,
      )}
      {...props}
    />
  )
}
