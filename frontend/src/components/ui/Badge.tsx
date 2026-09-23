import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'purple' | 'outline'
}

const BADGE_VARIANTS: Record<NonNullable<BadgeProps['variant']>, string> = {
  default:
    'bg-[#F0F2F5] text-slate-800 border-slate-200 dark:bg-[#262626] dark:text-slate-200 dark:border-[#383838]',
  primary:
    'bg-[#B6F23A] text-[#1A1A1A] border-[#9fdc2b] dark:bg-[#B6F23A] dark:text-[#1A1A1A] dark:border-[#9fdc2b] font-bold shadow-2xs',
  secondary:
    'bg-[#93D620] text-[#1A1A1A] border-[#81bf16] font-bold',
  tertiary:
    'bg-[#EDFBD8] text-[#365314] border-[#cbebb0] dark:bg-[#EDFBD8]/15 dark:text-[#B6F23A] dark:border-[#B6F23A]/30 font-semibold',
  success:
    'bg-[#EDFBD8] text-[#2b470c] border-[#c4e8a4] dark:bg-[#EDFBD8]/15 dark:text-[#B6F23A] dark:border-[#B6F23A]/30 font-semibold',
  warning:
    'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700',
  danger:
    'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800',
  purple:
    'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-800',
  outline:
    'bg-transparent text-slate-700 border-slate-300 dark:text-slate-300 dark:border-[#404040]',
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
        BADGE_VARIANTS[variant],
        className,
      )}
      {...props}
    />
  )
}
