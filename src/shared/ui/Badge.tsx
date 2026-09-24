import type { ReactNode } from 'react'

import { cn } from './cn'

export interface BadgeProps {
  children: ReactNode
  /** Foreground/background color pair - typically a `var(--role-...)` pair. */
  fg: string
  bg: string
  className?: string
}

/** Pill badge styled after the mockup's `.badge` - takes an explicit color pair. */
export function Badge({ children, fg, bg, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        className,
      )}
      style={{ backgroundColor: bg, color: fg }}
    >
      {children}
    </span>
  )
}
