import type { ReactNode } from 'react'

import { Card } from '@/shared/ui/Card'

/** Centered branded shell shared by the login and set-password screens. */
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex items-center justify-center gap-2.5">
          <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-accent text-[16px] font-semibold text-accent-ink font-serif">
            E
          </div>
          <div className="text-[17px] font-semibold tracking-tight text-ink font-serif">
            E-School
          </div>
        </div>
        <Card className="p-6">
          <h1 className="mb-4 text-xl font-semibold text-ink font-serif">{title}</h1>
          {children}
        </Card>
      </div>
    </div>
  )
}
