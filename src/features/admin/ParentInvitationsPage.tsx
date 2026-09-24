import { type FormEvent, useState } from 'react'

import { apiFetch, ApiError } from '@/shared/api/client'

export function ParentInvitationsPage() {
  const [email, setEmail] = useState('')
  const [studentId, setStudentId] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setSubmitting(true)
    try {
      const result = await apiFetch<{ message: string }>('/api/v1/parent-invitations', {
        method: 'POST',
        body: { email, student_id: Number(studentId) },
      })
      setSuccessMessage(result.message)
      setEmail('')
      setStudentId('')
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
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-xl font-semibold">Pozivnice za roditelje</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 p-4">
        {successMessage && (
          <p className="rounded bg-green-50 p-2 text-sm text-green-700">{successMessage}</p>
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

        <div className="flex flex-wrap gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email roditelja
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 rounded border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="student_id" className="block text-sm font-medium text-gray-700">
              ID učenika
            </label>
            <input
              id="student_id"
              type="number"
              required
              min={1}
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              className="mt-1 rounded border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Slanje...' : 'Pošalji pozivnicu'}
        </button>
      </form>
    </div>
  )
}
