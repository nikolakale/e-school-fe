import { type FormEvent, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { apiFetch, ApiError } from '@/shared/api/client'
import { useAuthStore } from '@/shared/auth/store'
import type { User } from '@/shared/auth/types'

export function AcceptParentInvitationPage() {
  const { token } = useParams<{ token: string }>()
  const setUser = useAuthStore((state) => state.setUser)
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!token) return
    setError(null)
    setSubmitting(true)
    try {
      const { data } = await apiFetch<{ data: User }>(
        `/api/v1/parent-invitations/${token}/accept`,
        {
          method: 'POST',
          body: { name, password, password_confirmation: passwordConfirmation },
        },
      )
      setUser(data)
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err)
      } else {
        throw err
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Prihvatanje pozivnice (roditelj)</h1>

        {!token && <p className="rounded bg-red-50 p-2 text-sm text-red-700">Link nije validan.</p>}
        {error && (
          <div className="rounded bg-red-50 p-2 text-sm text-red-700">
            <p>{error.message}</p>
            {error.errors &&
              Object.values(error.errors)
                .flat()
                .map((message) => <p key={message}>{message}</p>)}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Ime i prezime
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Lozinka
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="password_confirmation"
            className="block text-sm font-medium text-gray-700"
          >
            Potvrda lozinke
          </label>
          <input
            id="password_confirmation"
            type="password"
            required
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !token}
          className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Slanje...' : 'Kreiraj nalog'}
        </button>
      </form>
    </div>
  )
}
