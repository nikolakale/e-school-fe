import type { CSSProperties, FormEvent, ReactNode } from 'react'

import { Button } from './Button'

/** Shared `<input>`/`<select>` styling, matching the mockup's `.field input/select`. */
export const fieldControlClass =
  'mt-0 rounded-lg border border-border bg-surface-2 px-2.5 py-2 text-[13.5px] text-ink focus:bg-surface focus:outline-2 focus:outline-accent focus:outline-offset-1'

/** Label + control wrapper, styled after the mockup's `.field`. */
export function Field({
  label,
  htmlFor,
  children,
  style,
}: {
  label: string
  htmlFor: string
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div className="flex min-w-[190px] flex-1 flex-col gap-1.5" style={style}>
      <label htmlFor={htmlFor} className="text-xs font-semibold text-ink-muted">
        {label}
      </label>
      {children}
    </div>
  )
}

/** Wraps a row of Fields, styled after the mockup's `.form-grid`. */
export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap gap-3.5">{children}</div>
}

/**
 * The "+ Dodaj X" create-form panel, styled after the mockup's `.form-card`.
 * Every page's create form follows the same toggle-button-then-form shape;
 * this just carries the shared chrome (title + cancel), not the field layout.
 */
export function FormCard({
  title,
  onCancel,
  onSubmit,
  children,
}: {
  title: string
  onCancel: () => void
  onSubmit: (event: FormEvent) => void
  children: ReactNode
}) {
  return (
    <form onSubmit={onSubmit} className="mb-4 rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[16.5px] font-semibold text-ink font-serif">{title}</h2>
        <Button type="button" variant="text" onClick={onCancel}>
          Otkaži
        </Button>
      </div>
      {children}
    </form>
  )
}
