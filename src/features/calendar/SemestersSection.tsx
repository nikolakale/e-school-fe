import { type FormEvent, useEffect, useState } from 'react'

import { apiFetch, ApiError } from '@/shared/api/client'
import { useAuthStore } from '@/shared/auth/store'

import type { SchoolYear, Semester } from './types'

/**
 * Polugodišta: viewing is scoped to a chosen školska godina (the list
 * endpoint is filtered by school_year_id), create form visible to Direktor
 * only.
 */
export function SemestersSection() {
  const user = useAuthStore((state) => state.user)
  const canCreate = user?.role.slug === 'direktor'

  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([])
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState('')

  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [showForm, setShowForm] = useState(false)
  const [formSchoolYearId, setFormSchoolYearId] = useState('')
  const [number, setNumber] = useState<'1' | '2'>('1')
  const [startsOn, setStartsOn] = useState('')
  const [endsOn, setEndsOn] = useState('')
  const [trimester1EndsOn, setTrimester1EndsOn] = useState('')
  const [trimester2EndsOn, setTrimester2EndsOn] = useState('')
  const [formError, setFormError] = useState<ApiError | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadSchoolYears() {
      try {
        const result = await apiFetch<{ data: SchoolYear[] }>('/api/v1/school-years')
        setSchoolYears(result.data)
        setSelectedSchoolYearId((current) => current || String(result.data[0]?.id ?? ''))
      } catch {
        // The year picker just stays empty; a real failure surfaces again
        // (and is shown) once a year can be selected and its semesters load.
      }
    }
    void loadSchoolYears()
  }, [])

  useEffect(() => {
    async function loadSemesters() {
      if (!selectedSchoolYearId) {
        setSemesters([])
        return
      }

      setLoading(true)
      setListError(null)
      try {
        const result = await apiFetch<{ data: Semester[] }>(
          `/api/v1/semesters?school_year_id=${selectedSchoolYearId}`,
        )
        setSemesters(result.data)
      } catch (err) {
        setListError(err instanceof ApiError ? err.message : 'Greška pri učitavanju polugodišta.')
      } finally {
        setLoading(false)
      }
    }

    void loadSemesters()
  }, [selectedSchoolYearId, refreshKey])

  function openForm() {
    setFormSchoolYearId(selectedSchoolYearId)
    setShowForm(true)
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setSuccessMessage(null)
    setSubmitting(true)
    try {
      await apiFetch<{ data: Semester }>('/api/v1/semesters', {
        method: 'POST',
        body: {
          school_year_id: Number(formSchoolYearId),
          number: Number(number),
          starts_on: startsOn,
          ends_on: endsOn,
          ...(trimester1EndsOn ? { trimester_1_ends_on: trimester1EndsOn } : {}),
          ...(trimester2EndsOn ? { trimester_2_ends_on: trimester2EndsOn } : {}),
        },
      })
      setSuccessMessage('Polugodište je kreirano.')
      setNumber('1')
      setStartsOn('')
      setEndsOn('')
      setTrimester1EndsOn('')
      setTrimester2EndsOn('')
      setShowForm(false)
      setSelectedSchoolYearId(formSchoolYearId)
      setRefreshKey((key) => key + 1)
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
        <h2 className="text-lg font-semibold">Polugodišta</h2>
        {canCreate && !showForm && (
          <button
            type="button"
            onClick={openForm}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Dodaj polugodište
          </button>
        )}
      </div>

      {canCreate && showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Novo polugodište</h3>
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
              <label
                htmlFor="sem_school_year_id"
                className="block text-sm font-medium text-gray-700"
              >
                Školska godina
              </label>
              <select
                id="sem_school_year_id"
                required
                value={formSchoolYearId}
                onChange={(event) => setFormSchoolYearId(event.target.value)}
                className="mt-1 rounded border border-gray-300 px-3 py-2"
              >
                <option value="" disabled>
                  Izaberite školsku godinu
                </option>
                {schoolYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sem_number" className="block text-sm font-medium text-gray-700">
                Broj polugodišta
              </label>
              <select
                id="sem_number"
                value={number}
                onChange={(event) => setNumber(event.target.value as '1' | '2')}
                className="mt-1 rounded border border-gray-300 px-3 py-2"
              >
                <option value="1">Prvo</option>
                <option value="2">Drugo</option>
              </select>
            </div>

            <div>
              <label htmlFor="sem_starts_on" className="block text-sm font-medium text-gray-700">
                Početak
              </label>
              <input
                id="sem_starts_on"
                type="date"
                required
                value={startsOn}
                onChange={(event) => setStartsOn(event.target.value)}
                className="mt-1 rounded border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="sem_ends_on" className="block text-sm font-medium text-gray-700">
                Kraj
              </label>
              <input
                id="sem_ends_on"
                type="date"
                required
                value={endsOn}
                onChange={(event) => setEndsOn(event.target.value)}
                className="mt-1 rounded border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label
                htmlFor="sem_trimester_1_ends_on"
                className="block text-sm font-medium text-gray-700"
              >
                Kraj 1. tromesečja (opciono)
              </label>
              <input
                id="sem_trimester_1_ends_on"
                type="date"
                value={trimester1EndsOn}
                onChange={(event) => setTrimester1EndsOn(event.target.value)}
                className="mt-1 rounded border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label
                htmlFor="sem_trimester_2_ends_on"
                className="block text-sm font-medium text-gray-700"
              >
                Kraj 2. tromesečja (opciono)
              </label>
              <input
                id="sem_trimester_2_ends_on"
                type="date"
                value={trimester2EndsOn}
                onChange={(event) => setTrimester2EndsOn(event.target.value)}
                className="mt-1 rounded border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Kreiranje...' : 'Kreiraj polugodište'}
          </button>
        </form>
      )}

      <div>
        <label
          htmlFor="sem_filter_school_year_id"
          className="block text-sm font-medium text-gray-700"
        >
          Prikaži za školsku godinu
        </label>
        <select
          id="sem_filter_school_year_id"
          value={selectedSchoolYearId}
          onChange={(event) => setSelectedSchoolYearId(event.target.value)}
          className="mt-1 rounded border border-gray-300 px-3 py-2"
        >
          {schoolYears.length === 0 && <option value="">Nema školskih godina</option>}
          {schoolYears.map((year) => (
            <option key={year.id} value={year.id}>
              {year.name}
            </option>
          ))}
        </select>
      </div>

      {listError && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{listError}</p>}
      {loading && <p className="text-sm text-gray-500">Učitavanje...</p>}

      {!loading && !listError && (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Polugodište
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Početak
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Kraj
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Kraj 1. trom.
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Kraj 2. trom.
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {semesters.map((semester) => (
                <tr key={semester.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{semester.number === 1 ? 'Prvo' : 'Drugo'}</td>
                  <td className="px-4 py-3">{semester.starts_on}</td>
                  <td className="px-4 py-3">{semester.ends_on}</td>
                  <td className="px-4 py-3">{semester.trimester_1_ends_on ?? '-'}</td>
                  <td className="px-4 py-3">{semester.trimester_2_ends_on ?? '-'}</td>
                </tr>
              ))}
              {semesters.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    Nema polugodišta za izabranu školsku godinu.
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
