import { useAuthStore } from '@/shared/auth/store'

/** Trivial authenticated landing page - other features aren't built yet. */
export function HomePage() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold">Dobrodošli, {user?.name}</h1>
      <p className="text-gray-600">Uloga: {user?.role.name}</p>
    </div>
  )
}
