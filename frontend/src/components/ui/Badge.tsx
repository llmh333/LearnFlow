import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'purple'
    | 'coral'
    | 'outline'
}

const BADGE_VARIANTS: Record<NonNullable<BadgeProps['variant']>, string> = {
  default:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  primary:
    'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 font-semibold',
  secondary:
    'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 font-semibold',
  tertiary:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-semibold',
  success:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-semibold',
  warning:
    'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700',
  danger:
    'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800',
  purple:
    'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-800',
  coral:
    'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-200 dark:border-orange-800',
  outline:
    'bg-transparent text-slate-700 border-slate-300 dark:text-slate-300 dark:border-slate-700',
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
