import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'

import { useAuthStore } from '@/shared/auth/store'

import { router } from './router'

export function App() {
  const status = useAuthStore((state) => state.status)
  const fetchMe = useAuthStore((state) => state.fetchMe)

  // Cookie auth gives no client-side signal on its own - ask the server once
  // on boot so a page refresh restores session state before routes render.
  useEffect(() => {
    void fetchMe()
  }, [fetchMe])

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-lg">Učitavanje...</div>
    )
  }

  return <RouterProvider router={router} />
}
