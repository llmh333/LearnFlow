import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

export function Card({ className, hoverable = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border-2 border-b-4 border-slate-200 bg-white p-5 sm:p-6 transition-all duration-150 dark:border-[#2b3940] dark:bg-[#1b272c]',
        hoverable &&
          'hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer',
        className,
      )}
      {...props}
    />
  )
}
