import type { ReactNode } from 'react'

import { cn } from './cn'

/** Card container styled after the mockup's `.card`. */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-surface', className)}>
      {children}
    </div>
  )
}

/** Toolbar row (search/filters) at the top of a card, above the table. */
export function CardToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border px-4 py-3.5">
      {children}
    </div>
  )
}

/** Footer row (pagination, counts) at the bottom of a card. */
export function CardFoot({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-[12.5px] text-ink-muted">
      {children}
    </div>
  )
}
