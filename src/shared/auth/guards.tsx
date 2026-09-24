import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuthStore } from './store'
import type { RoleSlug } from './types'

/** Redirects to /login when there is no authenticated user. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status)

  if (status === 'idle' || status === 'loading') {
    return <div className="p-8 text-lg">Učitavanje...</div>
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace />
  }

  return children
}

/** Renders children only when the authenticated user's role is in `roles`. */
export function RequireRole({ roles, children }: { roles: RoleSlug[]; children: ReactNode }) {
  const user = useAuthStore((state) => state.user)

  if (!user || !roles.includes(user.role.slug)) {
    return <div className="p-8 text-lg">403 - Nemate pristup ovoj stranici.</div>
  }

  return children
}
