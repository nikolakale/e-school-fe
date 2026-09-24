import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiFetch, ApiError } from '@/shared/api/client'
import { useAuthStore } from '@/shared/auth/store'

export interface Subject {
  id: number
  name: string
}

/**
 * Open-read list of subjects: any authenticated user can browse it, but only
 * Direktor sees the create form (the route itself has no role guard).
 */
export function SubjectsPage() {
  const user = useAuthStore((state) => state.user)
  const canCreate = user?.role.slug === 'direktor'

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [formError, setFormError] = useState<ApiError | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void loadSubjects()
  }, [])

  async function loadSubjects() {
    setLoading(true)
    setListError(null)
    try {
      const result = await apiFetch<{ data: Subject[] }>('/api/v1/subjects')
      setSubjects(result.data)
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Greška pri učitavanju predmeta.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setSuccessMessage(null)
    setSubmitting(true)
    try {
      await apiFetch<{ data: Subject }>('/api/v1/subjects', {
        method: 'POST',
        body: { name },
      })
      setSuccessMessage('Predmet je kreiran.')
      setName('')
      setShowForm(false)
      await loadSubjects()
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err)
      } else {
        throw err
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Predmeti</h1>
        {canCreate && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Dodaj predmet
          </button>
        )}
      </div>

      {canCreate && showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Novi predmet</h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Otkaži
            </button>
          </div>

          {successMessage && (
            <p className="rounded bg-green-50 p-2 text-sm text-green-700">{successMessage}</p>
          )}
          {formError && (
            <div className="rounded bg-red-50 p-2 text-sm text-red-700">
              <p>{formError.message}</p>
              {formError.errors &&
                Object.values(formError.errors)
                  .flat()
                  .map((message) => <p key={message}>{message}</p>)}
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Naziv
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 rounded border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Kreiranje...' : 'Kreiraj predmet'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        <h2 className="font-medium">Spisak predmeta</h2>

        {listError && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{listError}</p>}
        {loading && <p className="text-sm text-gray-500">Učitavanje...</p>}

        {!loading && !listError && (
          <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Naziv
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Lekcije
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {subjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{subject.name}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/subjects/${subject.id}/lessons`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Prikaži lekcije
                      </Link>
                    </td>
                  </tr>
                ))}
                {subjects.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-gray-500">
                      Nema predmeta.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
