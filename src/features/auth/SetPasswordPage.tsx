import { type FormEvent, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { apiFetch, ApiError } from '@/shared/api/client'

export function SetPasswordPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const missingParams = !email || !token

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await apiFetch<{ message: string }>('/api/v1/password/set', {
        method: 'POST',
        body: {
          email,
          token,
          password,
          password_confirmation: passwordConfirmation,
        },
      })
      navigate('/login', {
        replace: true,
        state: { message: 'Lozinka je uspešno postavljena. Prijavite se.' },
      })
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
        <h1 className="text-xl font-semibold">Postavljanje lozinke</h1>

        {missingParams && (
          <p className="rounded bg-red-50 p-2 text-sm text-red-700">
            Link nije validan - nedostaje email ili token.
          </p>
        )}
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
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            disabled
            className="mt-1 w-full rounded border border-gray-300 bg-gray-100 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Nova lozinka
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
          disabled={submitting || missingParams}
          className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Slanje...' : 'Postavi lozinku'}
        </button>
      </form>
    </div>
  )
}
