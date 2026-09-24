import { Link, Outlet, useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/shared/auth/store'

/** Root layout: a nav bar shown only when authenticated, wrapping every route. */
export function Layout() {
  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div>
      {status === 'authenticated' && user && (
        <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-3">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Link to="/" className="font-semibold">
              E-School
            </Link>
            <Link to="/subjects" className="text-gray-600 hover:text-gray-900">
              Predmeti
            </Link>
            {user.role.slug === 'direktor' && (
              <>
                <Link to="/admin/users" className="text-gray-600 hover:text-gray-900">
                  Korisnici
                </Link>
                <Link to="/admin/class-groups" className="text-gray-600 hover:text-gray-900">
                  Odeljenja
                </Link>
              </>
            )}
            {(user.role.slug === 'direktor' || user.role.slug === 'razredni_staresina') && (
              <Link to="/admin/parent-invitations" className="text-gray-600 hover:text-gray-900">
                Pozivnice za roditelje
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span>
              {user.name} ({user.role.name})
            </span>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50"
            >
              Odjava
            </button>
          </div>
        </nav>
      )}
      <Outlet />
    </div>
  )
}
