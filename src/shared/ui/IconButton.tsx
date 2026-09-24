import type { ButtonHTMLAttributes } from 'react'

import { cn } from './cn'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string
}

/** Small square icon-only button used for row actions, styled after `.icon-btn`. */
export function IconButton({ title, type = 'button', className, ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      title={title}
      aria-label={title}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-ink-faint hover:border-border hover:bg-surface-2 hover:text-ink',
        className,
      )}
      {...props}
    />
  )
}
