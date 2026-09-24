import { type FormEvent, useEffect, useState } from 'react'

import { apiFetch, ApiError } from '@/shared/api/client'
import type { ClassGroup } from '@/shared/auth/types'

export function ClassGroupsPage() {
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [formError, setFormError] = useState<ApiError | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void loadClassGroups()
  }, [])

  async function loadClassGroups() {
    setLoading(true)
    setListError(null)
    try {
      const result = await apiFetch<{ data: ClassGroup[] }>('/api/v1/class-groups')
      setClassGroups(result.data)
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Greška pri učitavanju odeljenja.')
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
      await apiFetch<{ data: ClassGroup }>('/api/v1/class-groups', {
        method: 'POST',
        body: { name, grade_level: Number(gradeLevel) },
      })
      setSuccessMessage('Odeljenje je kreirano.')
      setName('')
      setGradeLevel('')
      await loadClassGroups()
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
      <h1 className="text-xl font-semibold">Odeljenja</h1>

      <form onSubmit={handleCreate} className="space-y-4 rounded-lg border border-gray-200 p-4">
        <h2 className="font-medium">Novo odeljenje</h2>

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

          <div>
            <label htmlFor="grade_level" className="block text-sm font-medium text-gray-700">
              Razred
            </label>
            <input
              id="grade_level"
              type="number"
              required
              min={1}
              value={gradeLevel}
              onChange={(event) => setGradeLevel(event.target.value)}
              className="mt-1 rounded border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Kreiranje...' : 'Kreiraj odeljenje'}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="font-medium">Spisak odeljenja</h2>

        {listError && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{listError}</p>}
        {loading && <p className="text-sm text-gray-500">Učitavanje...</p>}

        {!loading && !listError && (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="py-2 pr-4">Naziv</th>
                <th className="py-2 pr-4">Razred</th>
              </tr>
            </thead>
            <tbody>
              {classGroups.map((group) => (
                <tr key={group.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{group.name}</td>
                  <td className="py-2 pr-4">{group.grade_level}</td>
                </tr>
              ))}
              {classGroups.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-4 text-center text-gray-500">
                    Nema odeljenja.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
