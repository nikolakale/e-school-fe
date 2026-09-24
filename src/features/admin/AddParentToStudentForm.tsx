import { type FormEvent, useState } from 'react'

import { apiFetch, ApiError } from '@/shared/api/client'
import { Button } from '@/shared/ui/Button'
import { fieldControlClass } from '@/shared/ui/Form'
import { FormErrors } from '@/shared/ui/Notice'

/**
 * Inline "+ Dodaj roditelja" form scoped to a single student row (lifted from
 * the former standalone /admin/parent-invitations page - the student is
 * already known from context here, so there's no student-id input). Submits
 * the same POST /api/v1/parent-invitations the old page used.
 */
export function AddParentToStudentForm({
  studentId,
  onCancel,
  onSuccess,
}: {
  studentId: number
  onCancel: () => void
  onSuccess: (message: string) => void
}) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await apiFetch<{ message: string }>('/api/v1/parent-invitations', {
        method: 'POST',
        body: { email, student_id: studentId },
      })
      onSuccess(result.message ?? 'Pozivnica poslata.')
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
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      {error && (
        <div className="w-full">
          <FormErrors error={error} />
        </div>
      )}
      <label htmlFor={`parent_email_${studentId}`} className="sr-only">
        Email roditelja
      </label>
      <input
        id={`parent_email_${studentId}`}
        type="email"
        required
        autoFocus
        placeholder="email@primer.rs"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className={fieldControlClass + ' py-1.5 text-[12.5px]'}
      />
      <Button type="submit" variant="secondary" disabled={submitting} className="py-1.5 text-xs">
        {submitting ? 'Slanje...' : 'Pošalji'}
      </Button>
      <Button type="button" variant="text" onClick={onCancel}>
        Otkaži
      </Button>
    </form>
  )
}
