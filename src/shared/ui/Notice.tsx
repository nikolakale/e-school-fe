import type { ReactNode } from 'react'

import type { ApiError } from '@/shared/api/client'

import { cn } from './cn'

/** Small inline success/error banner, used for form feedback across the app. */
export function Notice({
  variant,
  children,
}: {
  variant: 'success' | 'danger'
  children: ReactNode
}) {
  return (
    <p
      className={cn(
        'rounded-lg px-3 py-2 text-sm',
        variant === 'success' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
      )}
    >
      {children}
    </p>
  )
}

/** Renders an ApiError's message plus its field-level validation messages, if any. */
export function FormErrors({ error }: { error: ApiError }) {
  return (
    <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
      <p>{error.message}</p>
      {error.errors &&
        Object.values(error.errors)
          .flat()
          .map((message) => <p key={message}>{message}</p>)}
    </div>
  )
}
