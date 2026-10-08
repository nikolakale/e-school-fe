import { create } from 'zustand'

import { apiFetch } from '@/shared/api/client'

export interface DemoStatus {
  simulated_at: string | null
}

export type DemoJump = 'day' | 'week' | 'month' | 'reset'

interface DemoClockState {
  available: boolean
  simulatedAt: string | null
  fetchStatus: () => Promise<void>
  jump: (jump: DemoJump) => Promise<void>
}

/**
 * Faza 8 "Simulator" clock, shared across features (DemoSimulatorWidget
 * drives it). Anything computing "now" for business-facing UI - e.g.
 * whether a scheduled test has opened yet - must read `simulatedAt` from
 * here instead of the browser's own clock, since `Carbon::setTestNow()` on
 * the BE has no way to affect a client-side `new Date()`.
 */
export const useDemoClock = create<DemoClockState>((set) => ({
  available: false,
  simulatedAt: null,

  async fetchStatus() {
    try {
      const { data } = await apiFetch<{ data: DemoStatus }>('/api/v1/demo/status')
      set({ available: true, simulatedAt: data.simulated_at })
    } catch {
      set({ available: false, simulatedAt: null })
    }
  },

  async jump(jump) {
    const { data } = await apiFetch<{ data: DemoStatus }>('/api/v1/demo/time', {
      method: 'POST',
      body: { jump },
    })
    set({ simulatedAt: data.simulated_at })
  },
}))

/** The effective "now" for date comparisons: the simulated time while the demo clock is set, the real clock otherwise. */
export function useDemoNow(): Date {
  const simulatedAt = useDemoClock((state) => state.simulatedAt)
  return simulatedAt ? new Date(simulatedAt) : new Date()
}
