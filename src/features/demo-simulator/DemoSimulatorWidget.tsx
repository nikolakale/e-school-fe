import { useEffect, useState } from 'react'

import { apiFetch } from '@/shared/api/client'
import { Card } from '@/shared/ui/Card'
import { IconButton } from '@/shared/ui/IconButton'
import { IconClockRewind } from '@/shared/ui/icons'

import type { DemoJump, DemoStatus } from './types'

const JUMP_LABELS: Record<Exclude<DemoJump, 'reset'>, string> = {
  day: '+1 dan',
  week: '+1 nedelja',
  month: '+1 mesec',
}

function formatSimulatedAt(iso: string | null): string {
  if (!iso) return 'Realno vreme'
  return new Date(iso).toLocaleString('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Faza 8 "Simulator" - only renders once GET /api/v1/demo/status succeeds
 * (the route literally doesn't exist unless DEMO_MODE=true on the BE), per
 * Simulator.md: any logged-in user may drive it, it's a presentation tool,
 * not a permissioned feature.
 */
export function DemoSimulatorWidget() {
  const [status, setStatus] = useState<DemoStatus | null>(null)
  const [available, setAvailable] = useState(false)
  const [open, setOpen] = useState(false)
  const [jumping, setJumping] = useState<DemoJump | null>(null)

  useEffect(() => {
    async function loadStatus() {
      try {
        const result = await apiFetch<{ data: DemoStatus }>('/api/v1/demo/status')
        setStatus(result.data)
        setAvailable(true)
      } catch {
        setAvailable(false)
      }
    }
    void loadStatus()
  }, [])

  async function handleJump(jump: DemoJump) {
    setJumping(jump)
    try {
      const result = await apiFetch<{ data: DemoStatus }>('/api/v1/demo/time', {
        method: 'POST',
        body: { jump },
      })
      setStatus(result.data)
    } catch {
      // The panel just keeps showing the last known simulated time.
    } finally {
      setJumping(null)
    }
  }

  if (!available) return null

  return (
    <div className="fixed right-4 bottom-4 z-50">
      {open && (
        <Card className="mb-2 w-56 p-3.5 shadow-lg">
          <div className="mb-2 text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
            Simulator
          </div>
          <div className="mb-3 font-mono text-[13px] text-ink">
            {formatSimulatedAt(status?.simulated_at ?? null)}
          </div>
          <div className="flex flex-col gap-1.5">
            {(Object.keys(JUMP_LABELS) as Array<Exclude<DemoJump, 'reset'>>).map((jump) => (
              <button
                key={jump}
                type="button"
                disabled={jumping !== null}
                onClick={() => void handleJump(jump)}
                className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-left text-[12.5px] font-medium text-ink hover:bg-surface-2 disabled:opacity-50"
              >
                {jumping === jump ? '...' : JUMP_LABELS[jump]}
              </button>
            ))}
            <button
              type="button"
              disabled={jumping !== null}
              onClick={() => void handleJump('reset')}
              className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-left text-[12.5px] font-medium text-danger hover:bg-danger-soft disabled:opacity-50"
            >
              {jumping === 'reset' ? '...' : 'Resetuj na realno vreme'}
            </button>
          </div>
        </Card>
      )}
      <IconButton
        title="Simulator (demo mode)"
        onClick={() => setOpen((current) => !current)}
        className="h-10 w-10 border-border bg-accent text-accent-ink shadow-lg hover:bg-accent hover:brightness-105"
      >
        <IconClockRewind className="h-5 w-5" />
      </IconButton>
    </div>
  )
}
