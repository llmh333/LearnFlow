import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className={cn('w-full text-left text-sm', className)} {...props} />
    </div>
  )
}

export function TableHeader(props: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className="border-b border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
      {...props}
    />
  )
}

export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="divide-y divide-slate-100 dark:divide-slate-800" {...props} />
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60',
        className,
      )}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300',
        className,
      )}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3.5 text-slate-900 dark:text-slate-100 font-medium', className)} {...props} />
}
