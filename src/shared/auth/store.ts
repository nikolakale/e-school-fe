import { create } from 'zustand'

import { apiFetch, ApiError } from '@/shared/api/client'

import type { User } from './types'

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  user: User | null
  status: AuthStatus
  /** Authenticates via /login and stores the returned user. */
  login: (email: string, password: string) => Promise<void>
  /** Logs out server-side and clears local state. */
  logout: () => Promise<void>
  /**
   * Asks the server whether the session cookie is still valid. Used to restore
   * auth state on app boot (e.g. after a page refresh) since cookie auth gives
   * no client-side signal on its own. A 401 is a normal "not logged in" result,
   * not an error.
   */
  fetchMe: () => Promise<void>
  /**
   * Adopts an already-authenticated user without a round-trip to /me - used
   * after flows other than /login that also end with a live session (e.g.
   * accepting a parent invitation), since their response already carries the
   * full UserResource.
   */
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',

  async login(email, password) {
    set({ status: 'loading' })
    try {
      const { data } = await apiFetch<{ data: User }>('/api/v1/login', {
        method: 'POST',
        body: { email, password },
      })
      set({ user: data, status: 'authenticated' })
    } catch (error) {
      set({ user: null, status: 'unauthenticated' })
      throw error
    }
  },

  async logout() {
    await apiFetch<void>('/api/v1/logout', { method: 'POST' })
    set({ user: null, status: 'unauthenticated' })
  },

  async fetchMe() {
    set({ status: 'loading' })
    try {
      const { data } = await apiFetch<{ data: User }>('/api/v1/me')
      set({ user: data, status: 'authenticated' })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        set({ user: null, status: 'unauthenticated' })
        return
      }
      set({ user: null, status: 'unauthenticated' })
      throw error
    }
  },

  setUser(user) {
    set({ user, status: 'authenticated' })
  },
}))
