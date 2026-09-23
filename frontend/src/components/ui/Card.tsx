import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

export function Card({ className, hoverable = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 dark:border-[#2C2C2C] dark:bg-[#1E1E1E]',
        hoverable && 'hover:-translate-y-0.5 hover:shadow-md hover:border-[#93D620] dark:hover:border-[#383838]',
        className,
      )}
      {...props}
    />
  )
}
