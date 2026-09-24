import { type FormEvent, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { apiFetch, ApiError } from '@/shared/api/client'
import { Button } from '@/shared/ui/Button'
import { Field, fieldControlClass } from '@/shared/ui/Form'
import { FormErrors, Notice } from '@/shared/ui/Notice'

import { AuthCard } from './AuthCard'

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
    <AuthCard title="Postavljanje lozinke">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {missingParams && (
          <Notice variant="danger">Link nije validan - nedostaje email ili token.</Notice>
        )}
        {error && <FormErrors error={error} />}

        <Field label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            value={email}
            disabled
            className={`${fieldControlClass} w-full disabled:text-ink-muted`}
          />
        </Field>

        <Field label="Nova lozinka" htmlFor="password">
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`${fieldControlClass} w-full`}
          />
        </Field>

        <Field label="Potvrda lozinke" htmlFor="password_confirmation">
          <input
            id="password_confirmation"
            type="password"
            required
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            className={`${fieldControlClass} w-full`}
          />
        </Field>

        <Button
          type="submit"
          disabled={submitting || missingParams}
          className="w-full justify-center"
        >
          {submitting ? 'Slanje...' : 'Postavi lozinku'}
        </Button>
      </form>
    </AuthCard>
  )
}
