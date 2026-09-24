import { type FormEvent, useEffect, useState } from 'react'

import { apiFetch, ApiError } from '@/shared/api/client'
import { useAuthStore } from '@/shared/auth/store'

import type { SchoolYear } from './types'

/** Školske godine: open-read list, create form visible to Direktor only. */
export function SchoolYearsSection() {
  const user = useAuthStore((state) => state.user)
  const canCreate = user?.role.slug === 'direktor'

  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [startsOn, setStartsOn] = useState('')
  const [endsOn, setEndsOn] = useState('')
  const [formError, setFormError] = useState<ApiError | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void loadSchoolYears()
  }, [])

  async function loadSchoolYears() {
    setLoading(true)
    setListError(null)
    try {
      const result = await apiFetch<{ data: SchoolYear[] }>('/api/v1/school-years')
      setSchoolYears(result.data)
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Greška pri učitavanju školskih godina.')
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
      await apiFetch<{ data: SchoolYear }>('/api/v1/school-years', {
        method: 'POST',
        body: { name, starts_on: startsOn, ends_on: endsOn },
      })
      setSuccessMessage('Školska godina je kreirana.')
      setName('')
      setStartsOn('')
      setEndsOn('')
      setShowForm(false)
      await loadSchoolYears()
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
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Školske godine</h2>
        {canCreate && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Dodaj školsku godinu
          </button>
        )}
      </div>

      {canCreate && showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Nova školska godina</h3>
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
              <label htmlFor="sy_name" className="block text-sm font-medium text-gray-700">
                Naziv
              </label>
              <input
                id="sy_name"
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 rounded border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="sy_starts_on" className="block text-sm font-medium text-gray-700">
                Početak
              </label>
              <input
                id="sy_starts_on"
                type="date"
                required
                value={startsOn}
                onChange={(event) => setStartsOn(event.target.value)}
                className="mt-1 rounded border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="sy_ends_on" className="block text-sm font-medium text-gray-700">
                Kraj
              </label>
              <input
                id="sy_ends_on"
                type="date"
                required
                value={endsOn}
                onChange={(event) => setEndsOn(event.target.value)}
                className="mt-1 rounded border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Kreiranje...' : 'Kreiraj školsku godinu'}
          </button>
        </form>
      )}

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
                  Početak
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Kraj
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {schoolYears.map((year) => (
                <tr key={year.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{year.name}</td>
                  <td className="px-4 py-3">{year.starts_on}</td>
                  <td className="px-4 py-3">{year.ends_on}</td>
                </tr>
              ))}
              {schoolYears.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                    Nema školskih godina.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
