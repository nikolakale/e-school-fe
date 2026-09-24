import type { ReactNode } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { initials } from '@/shared/auth/roleColors'
import { useAuthStore } from '@/shared/auth/store'
import { IconButton } from '@/shared/ui/IconButton'
import {
  IconCalendar,
  IconClassGroups,
  IconLogout,
  IconScheduledTests,
  IconSubjects,
  IconUsers,
} from '@/shared/ui/icons'

interface NavItem {
  to: string
  label: string
  icon: (props: { className?: string }) => ReactNode
}

const NASTAVA_ITEMS: NavItem[] = [
  { to: '/subjects', label: 'Predmeti', icon: IconSubjects },
  { to: '/calendar', label: 'Kalendar', icon: IconCalendar },
  { to: '/scheduled-tests', label: 'Zakazani testovi', icon: IconScheduledTests },
]

const ADMINISTRACIJA_ITEMS: NavItem[] = [
  { to: '/admin/users', label: 'Korisnici', icon: IconUsers },
  { to: '/admin/class-groups', label: 'Odeljenja', icon: IconClassGroups },
]

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <nav className="flex flex-col gap-0.5 max-[760px]:flex-row max-[760px]:items-center">
      <div className="px-2.5 pt-2.5 pb-1 text-[11px] font-semibold tracking-wide text-ink-faint uppercase max-[760px]:hidden">
        {label}
      </div>
      {items.map(({ to, label: itemLabel, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            [
              'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] font-medium whitespace-nowrap text-ink-muted hover:bg-surface-2 hover:text-ink',
              isActive ? 'bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent' : '',
            ].join(' ')
          }
        >
          <Icon className="h-4 w-4 shrink-0 opacity-85" />
          {itemLabel}
        </NavLink>
      ))}
    </nav>
  )
}

/** Root layout: the approved sidebar shown only when authenticated, wrapping every route. */
export function Layout() {
  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  if (status !== 'authenticated' || !user) {
    return <Outlet />
  }

  return (
    <div className="flex min-h-screen bg-bg text-ink max-[760px]:flex-col">
      <aside className="flex w-58 shrink-0 flex-col gap-5.5 border-r border-border bg-surface p-3.5 max-[760px]:w-full max-[760px]:flex-row max-[760px]:items-center max-[760px]:overflow-x-auto max-[760px]:border-r-0 max-[760px]:border-b max-[760px]:p-3">
        <div className="flex items-center gap-2.5 px-2 py-1 max-[760px]:shrink-0">
          <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-accent text-[16px] font-semibold text-accent-ink font-serif">
            E
          </div>
          <div className="text-[17px] font-semibold tracking-tight text-ink font-serif">
            E-School
          </div>
        </div>

        <NavGroup label="Nastava" items={NASTAVA_ITEMS} />

        {user.role.slug === 'direktor' && (
          <NavGroup label="Administracija" items={ADMINISTRACIJA_ITEMS} />
        )}

        <div className="mt-auto flex items-center gap-2 border-t border-border pt-3.5 max-[760px]:mt-0 max-[760px]:ml-auto max-[760px]:shrink-0 max-[760px]:border-t-0 max-[760px]:border-l max-[760px]:pt-0 max-[760px]:pl-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--role-direktor-bg)] text-[11.5px] font-semibold text-[var(--role-direktor-fg)]">
            {initials(user.name)}
          </div>
          <div className="max-[760px]:hidden">
            <div className="text-[12.5px] font-semibold text-ink">{user.name}</div>
            <div className="text-[11.5px] text-ink-muted">{user.role.name}</div>
          </div>
          <IconButton title="Odjava" onClick={() => void handleLogout()} className="ml-1">
            <IconLogout className="h-4 w-4" />
          </IconButton>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-9 py-7 max-[760px]:px-4 max-[760px]:py-5">
        <Outlet />
      </main>
    </div>
  )
}
