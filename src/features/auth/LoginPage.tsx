import { type FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { ApiError } from '@/shared/api/client'
import { useAuthStore } from '@/shared/auth/store'
import { Button } from '@/shared/ui/Button'
import { Field, fieldControlClass } from '@/shared/ui/Form'
import { FormErrors, Notice } from '@/shared/ui/Notice'

import { AuthCard } from './AuthCard'

export function LoginPage() {
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const location = useLocation()
  const successMessage = (location.state as { message?: string } | null)?.message

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
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
    <AuthCard title="Prijava">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {successMessage && <Notice variant="success">{successMessage}</Notice>}
        {error && <FormErrors error={error} />}

        <Field label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={`${fieldControlClass} w-full`}
          />
        </Field>

        <Field label="Lozinka" htmlFor="password">
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`${fieldControlClass} w-full`}
          />
        </Field>

        <Button type="submit" disabled={submitting} className="w-full justify-center">
          {submitting ? 'Prijava...' : 'Prijavi se'}
        </Button>

        <p className="text-center text-[13px] text-ink-muted">
          <Link to="/set-password" className="text-accent hover:underline">
            Postavljanje lozinke sa linka iz mejla
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}
