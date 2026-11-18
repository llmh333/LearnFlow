import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'ghost'
    | 'danger'
    | 'success'
    | 'outline'
    | 'inverted'
    | 'lime'
    | 'coral'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-xs border border-transparent font-semibold',
  secondary:
    'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:active:bg-slate-600 font-medium',
  inverted:
    'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-700 shadow-xs dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold',
  outline:
    'bg-transparent text-slate-700 border border-slate-300 hover:bg-slate-100 active:bg-slate-200 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:active:bg-slate-700',
  lime: 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-xs font-semibold',
  coral:
    'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 shadow-xs font-semibold',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs font-semibold',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-xs font-semibold',
}

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-base rounded-xl gap-2.5',
  icon: 'h-9 w-9 p-0 rounded-full items-center justify-center',
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  )
}
