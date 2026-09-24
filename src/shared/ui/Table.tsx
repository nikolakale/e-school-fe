import type { ReactNode, ThHTMLAttributes } from 'react'

import { cn } from './cn'

/** Table primitives styled after the mockup's table CSS - a shared table look for every list page. */
export function Table({ children }: { children: ReactNode }) {
  return (
    <table className="w-full border-collapse text-left text-[13.5px]">
      <colgroup />
      {children}
    </table>
  )
}

export function Th({ children, className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'border-b border-border bg-surface-2 px-4 py-2.5 text-[11px] font-semibold tracking-wide text-ink-faint uppercase',
        className,
      )}
      {...props}
    >
      {children}
    </th>
  )
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>
}

export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn('hover:bg-surface-2', className)}>{children}</tr>
}

export function Td({
  children,
  className,
  colSpan,
}: {
  children?: ReactNode
  className?: string
  colSpan?: number
}) {
  return (
    <td className={cn('px-4 py-2.5 align-middle', className)} colSpan={colSpan}>
      {children}
    </td>
  )
}

/** Full-width "nothing here yet" row. */
export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-6 text-center text-ink-muted">
        {children}
      </td>
    </tr>
  )
}
