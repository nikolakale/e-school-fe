import type { ButtonHTMLAttributes } from 'react'

import { cn } from './cn'

type Variant = 'primary' | 'secondary' | 'text'

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-ink px-3.5 py-2.5 text-[13.5px] shadow-sm hover:brightness-105 disabled:hover:brightness-100',
  secondary:
    'border border-border bg-surface text-ink px-3.5 py-2 text-[13.5px] hover:bg-surface-2',
  text: 'text-ink-muted px-1.5 py-1 text-[12.5px] hover:text-ink',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

/** Button styled after the mockup's `.btn-primary` / `.btn-secondary` / `.btn-text`. */
export function Button({ variant = 'primary', type = 'button', className, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg font-semibold disabled:cursor-default disabled:opacity-50',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  )
}
