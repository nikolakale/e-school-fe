import type { ReactNode } from 'react'

export interface PageHeaderProps {
  eyebrow: string
  title: string
  subtitle?: ReactNode
  action?: ReactNode
}

/** Page-level heading styled after the mockup's `.page-head`. */
export function PageHeader({ eyebrow, title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-5.5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-1 text-[11.5px] font-semibold tracking-wide text-ink-faint uppercase">
          {eyebrow}
        </p>
        <h1 className="text-[27px] font-semibold tracking-tight text-ink text-balance font-serif">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-[13.5px] text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
