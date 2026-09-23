import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-[#1A1A1A] transition-all duration-150 focus:border-[#93D620] focus:outline-none focus:ring-3 focus:ring-[#B6F23A]/25 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-[#383838] dark:bg-[#1E1E1E] dark:text-white dark:focus:border-[#B6F23A] dark:focus:ring-[#B6F23A]/20',
        className,
      )}
      {...props}
    />
  )
}
