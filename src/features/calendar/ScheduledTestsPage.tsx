import { Fragment, type FormEvent, useEffect, useState } from 'react'

import { apiFetch, ApiError } from '@/shared/api/client'
import { useAuthStore } from '@/shared/auth/store'
import type { ClassGroup } from '@/shared/auth/types'

import {
  SCHEDULED_TEST_TYPE_LABELS,
  type Holiday,
  type ScheduledTest,
  type ScheduledTestType,
  type SchoolYear,
  type Semester,
} from './types'

interface Subject {
  id: number
  name: string
}

const TEST_TYPES: ScheduledTestType[] = ['mesecni', 'dvomesecni', 'polugodisnji', 'godisnji']

/** `datetime-local` gives "YYYY-MM-DDTHH:mm" in local time; the API wants ISO8601. */
function toIsoDateTime(localValue: string): string {
  return new Date(localValue).toISOString()
}

/** Reverse of `toIsoDateTime`, for pre-filling the reschedule form. */
function toLocalInputValue(isoValue: string): string {
  const date = new Date(isoValue)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * Zakazani testovi: an odeljenje picker drives which tests are shown.
 * Scheduling a new test (and rescheduling an existing one) is visible to
 * Nastavnik/Razredni starešina/Direktor only - the API is the real source of
 * truth on who may actually schedule a given subject+class pair and whether
 * a test can still be rescheduled, so this page just surfaces its errors.
 */
export function ScheduledTestsPage() {
  const user = useAuthStore((state) => state.user)
  const canSchedule =
    user?.role.slug === 'nastavnik' ||
    user?.role.slug === 'razredni_staresina' ||
    user?.role.slug === 'direktor'

  const [classGroups, setClassGroups] = useState<ClassGroup[]>([])
  const [selectedClassGroupId, setSelectedClassGroupId] = useState('')

  const [tests, setTests] = useState<ScheduledTest[]>([])
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [holidays, setHolidays] = useState<Holiday[]>([])

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])

  const [showForm, setShowForm] = useState(false)
  const [subjectId, setSubjectId] = useState('')
  const [formClassGroupId, setFormClassGroupId] = useState('')
  const [semesterId, setSemesterId] = useState('')
  const [type, setType] = useState<ScheduledTestType>('mesecni')
  const [availableFrom, setAvailableFrom] = useState('')
  const [availableUntil, setAvailableUntil] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [retakeAllowed, setRetakeAllowed] = useState(false)
  const [retakeWaitDays, setRetakeWaitDays] = useState('')
  const [formError, setFormError] = useState<ApiError | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [rescheduleId, setRescheduleId] = useState<number | null>(null)
  const [rescheduleFrom, setRescheduleFrom] = useState('')
  const [rescheduleUntil, setRescheduleUntil] = useState('')
  const [rescheduleError, setRescheduleError] = useState<ApiError | null>(null)
  const [rescheduling, setRescheduling] = useState(false)

  // Class groups drive both the page's own filter and the form's odeljenje select.
  useEffect(() => {
    async function loadClassGroups() {
      try {
        const result = await apiFetch<{ data: ClassGroup[] }>('/api/v1/class-groups')
        setClassGroups(result.data)
        setSelectedClassGroupId((current) => current || String(result.data[0]?.id ?? ''))
      } catch {
        // The picker just stays empty; the page below shows nothing to pick.
      }
    }
    void loadClassGroups()
  }, [])

  // Options for the create form's selects, fetched once.
  useEffect(() => {
    async function loadFormOptions() {
      try {
        const [subjectsResult, schoolYearsResult, semestersResult] = await Promise.all([
          apiFetch<{ data: Subject[] }>('/api/v1/subjects'),
          apiFetch<{ data: SchoolYear[] }>('/api/v1/school-years'),
          apiFetch<{ data: Semester[] }>('/api/v1/semesters'),
        ])
        setSubjects(subjectsResult.data)
        setSchoolYears(schoolYearsResult.data)
        setSemesters(semestersResult.data)
      } catch {
        // The form's selects just stay empty; a real failure surfaces again
        // (and is shown) when the form is submitted.
      }
    }
    void loadFormOptions()
  }, [])

  // Scheduled tests (and holiday context) for the selected odeljenje.
  useEffect(() => {
    async function loadTests() {
      if (!selectedClassGroupId) {
        setTests([])
        return
      }

      setLoading(true)
      setListError(null)
      try {
        const result = await apiFetch<{ data: ScheduledTest[] }>(
          `/api/v1/scheduled-tests?class_group_id=${selectedClassGroupId}`,
        )
        setTests(result.data)
      } catch (err) {
        setListError(err instanceof ApiError ? err.message : 'Greška pri učitavanju testova.')
      } finally {
        setLoading(false)
      }
    }

    async function loadHolidayContext() {
      if (!selectedClassGroupId) {
        setHolidays([])
        return
      }

      try {
        const yearsResult = await apiFetch<{ data: SchoolYear[] }>('/api/v1/school-years')
        const today = new Date().toISOString().slice(0, 10)
        const currentYear =
          yearsResult.data.find((year) => year.starts_on <= today && today <= year.ends_on) ??
          yearsResult.data[0]
        if (!currentYear) {
          setHolidays([])
          return
        }
        const holidaysResult = await apiFetch<{ data: Holiday[] }>(
          `/api/v1/holidays?school_year_id=${currentYear.id}`,
        )
        setHolidays(holidaysResult.data)
      } catch {
        // Holidays are just display context here - fail silently.
        setHolidays([])
      }
    }

    void loadTests()
    void loadHolidayContext()
  }, [selectedClassGroupId, refreshKey])

  function openForm() {
    setFormClassGroupId(selectedClassGroupId)
    setShowForm(true)
  }

  function semesterLabel(semester: Semester): string {
    const yearName = schoolYears.find((year) => year.id === semester.school_year_id)?.name
    const semesterName = semester.number === 1 ? 'I polugodište' : 'II polugodište'
    return yearName ? `${yearName} - ${semesterName}` : semesterName
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setSuccessMessage(null)
    setSubmitting(true)
    try {
      await apiFetch<{ data: ScheduledTest }>('/api/v1/scheduled-tests', {
        method: 'POST',
        body: {
          subject_id: Number(subjectId),
          class_group_id: Number(formClassGroupId),
          semester_id: Number(semesterId),
          type,
          available_from: toIsoDateTime(availableFrom),
          available_until: toIsoDateTime(availableUntil),
          ...(durationMinutes ? { duration_minutes: Number(durationMinutes) } : {}),
          retake_allowed: retakeAllowed,
          ...(retakeAllowed && retakeWaitDays ? { retake_wait_days: Number(retakeWaitDays) } : {}),
        },
      })
      setSuccessMessage('Test je zakazan.')
      setSubjectId('')
      setSemesterId('')
      setType('mesecni')
      setAvailableFrom('')
      setAvailableUntil('')
      setDurationMinutes('')
      setRetakeAllowed(false)
      setRetakeWaitDays('')
      setShowForm(false)
      setSelectedClassGroupId(formClassGroupId)
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

  function openReschedule(test: ScheduledTest) {
    setRescheduleId(test.id)
    setRescheduleFrom(toLocalInputValue(test.available_from))
    setRescheduleUntil(toLocalInputValue(test.available_until))
    setRescheduleError(null)
  }

  async function handleReschedule(event: FormEvent) {
    event.preventDefault()
    if (rescheduleId === null) return
    setRescheduleError(null)
    setRescheduling(true)
    try {
      await apiFetch<{ data: ScheduledTest }>(`/api/v1/scheduled-tests/${rescheduleId}`, {
        method: 'PUT',
        body: {
          available_from: toIsoDateTime(rescheduleFrom),
          available_until: toIsoDateTime(rescheduleUntil),
        },
      })
      setRescheduleId(null)
      setRefreshKey((key) => key + 1)
    } catch (err) {
      if (err instanceof ApiError) {
        setRescheduleError(err)
      } else {
        throw err
      }
    } finally {
      setRescheduling(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Zakazani testovi</h1>
        {canSchedule && !showForm && (
          <button
            type="button"
            onClick={openForm}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Zakazivanje testa
          </button>
        )}
      </div>

      {canSchedule && showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Zakazivanje testa</h2>
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
              <label htmlFor="st_subject_id" className="block text-sm font-medium text-gray-700">
                Predmet
              </label>
              <select
                id="st_subject_id"
                required
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
                className="mt-1 rounded border border-gray-300 px-3 py-2"
              >
                <option value="" disabled>
                  Izaberite predmet
                </option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="st_class_group_id"
                className="block text-sm font-medium text-gray-700"
              >
                Odeljenje
              </label>
              <select
                id="st_class_group_id"
                required
                value={formClassGroupId}
                onChange={(event) => setFormClassGroupId(event.target.value)}
                className="mt-1 rounded border border-gray-300 px-3 py-2"
              >
                <option value="" disabled>
                  Izaberite odeljenje
                </option>
                {classGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="st_semester_id" className="block text-sm font-medium text-gray-700">
                Semestar
              </label>
              <select
                id="st_semester_id"
                required
                value={semesterId}
                onChange={(event) => setSemesterId(event.target.value)}
                className="mt-1 rounded border border-gray-300 px-3 py-2"
              >
                <option value="" disabled>
                  Izaberite semestar
                </option>
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semesterLabel(semester)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="st_type" className="block text-sm font-medium text-gray-700">
                Tip
              </label>
              <select
                id="st_type"
                value={type}
                onChange={(event) => setType(event.target.value as ScheduledTestType)}
                className="mt-1 rounded border border-gray-300 px-3 py-2"
              >
                {TEST_TYPES.map((testType) => (
                  <option key={testType} value={testType}>
                    {SCHEDULED_TEST_TYPE_LABELS[testType]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="st_available_from"
                className="block text-sm font-medium text-gray-700"
              >
                Dostupan od
              </label>
              <input
                id="st_available_from"
                type="datetime-local"
                required
                value={availableFrom}
                onChange={(event) => setAvailableFrom(event.target.value)}
                className="mt-1 rounded border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label
                htmlFor="st_available_until"
                className="block text-sm font-medium text-gray-700"
              >
                Dostupan do
              </label>
              <input
                id="st_available_until"
                type="datetime-local"
                required
                value={availableUntil}
                onChange={(event) => setAvailableUntil(event.target.value)}
                className="mt-1 rounded border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label
                htmlFor="st_duration_minutes"
                className="block text-sm font-medium text-gray-700"
              >
                Trajanje (min, opciono)
              </label>
              <input
                id="st_duration_minutes"
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                className="mt-1 rounded border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2">
              <input
                id="st_retake_allowed"
                type="checkbox"
                checked={retakeAllowed}
                onChange={(event) => setRetakeAllowed(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="st_retake_allowed" className="text-sm font-medium text-gray-700">
                Popravni dozvoljen
              </label>
            </div>

            {retakeAllowed && (
              <div>
                <label
                  htmlFor="st_retake_wait_days"
                  className="block text-sm font-medium text-gray-700"
                >
                  Dana čekanja do popravnog
                </label>
                <input
                  id="st_retake_wait_days"
                  type="number"
                  required
                  min={0}
                  value={retakeWaitDays}
                  onChange={(event) => setRetakeWaitDays(event.target.value)}
                  className="mt-1 rounded border border-gray-300 px-3 py-2"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Zakazivanje...' : 'Zakaži test'}
          </button>
        </form>
      )}

      <div>
        <label htmlFor="st_class_group_filter" className="block text-sm font-medium text-gray-700">
          Odeljenje
        </label>
        <select
          id="st_class_group_filter"
          value={selectedClassGroupId}
          onChange={(event) => setSelectedClassGroupId(event.target.value)}
          className="mt-1 rounded border border-gray-300 px-3 py-2"
        >
          {classGroups.length === 0 && <option value="">Nema odeljenja</option>}
          {classGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {holidays.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-medium">Praznici u tekućoj školskoj godini</p>
          <ul className="mt-1 list-inside list-disc">
            {holidays.map((holiday) => (
              <li key={holiday.id}>
                {holiday.name}: {holiday.starts_on} - {holiday.ends_on}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {listError && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{listError}</p>}
        {loading && <p className="text-sm text-gray-500">Učitavanje...</p>}

        {!loading && !listError && (
          <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Predmet
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Tip
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Dostupan od
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Dostupan do
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Trajanje
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Popravni
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Zakazao
                  </th>
                  {canSchedule && (
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase" />
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {tests.map((test) => (
                  <Fragment key={test.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">{test.subject.name}</td>
                      <td className="px-4 py-3">{SCHEDULED_TEST_TYPE_LABELS[test.type]}</td>
                      <td className="px-4 py-3">
                        {new Date(test.available_from).toLocaleString('sr-RS')}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(test.available_until).toLocaleString('sr-RS')}
                      </td>
                      <td className="px-4 py-3">{test.duration_minutes ?? '-'}</td>
                      <td className="px-4 py-3">
                        {test.retake_allowed ? `Da (${test.retake_wait_days ?? '-'} d.)` : 'Ne'}
                      </td>
                      <td className="px-4 py-3">{test.scheduled_by.name}</td>
                      {canSchedule && (
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openReschedule(test)}
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Pomeri
                          </button>
                        </td>
                      )}
                    </tr>
                    {rescheduleId === test.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={canSchedule ? 8 : 7} className="px-4 py-3">
                          <form
                            onSubmit={handleReschedule}
                            className="flex flex-wrap items-end gap-4"
                          >
                            {rescheduleError && (
                              <div className="w-full rounded bg-red-50 p-2 text-sm text-red-700">
                                <p>{rescheduleError.message}</p>
                                {rescheduleError.errors &&
                                  Object.values(rescheduleError.errors)
                                    .flat()
                                    .map((message) => <p key={message}>{message}</p>)}
                              </div>
                            )}

                            <div>
                              <label
                                htmlFor={`reschedule_from_${test.id}`}
                                className="block text-sm font-medium text-gray-700"
                              >
                                Dostupan od
                              </label>
                              <input
                                id={`reschedule_from_${test.id}`}
                                type="datetime-local"
                                required
                                value={rescheduleFrom}
                                onChange={(event) => setRescheduleFrom(event.target.value)}
                                className="mt-1 rounded border border-gray-300 px-3 py-2"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor={`reschedule_until_${test.id}`}
                                className="block text-sm font-medium text-gray-700"
                              >
                                Dostupan do
                              </label>
                              <input
                                id={`reschedule_until_${test.id}`}
                                type="datetime-local"
                                required
                                value={rescheduleUntil}
                                onChange={(event) => setRescheduleUntil(event.target.value)}
                                className="mt-1 rounded border border-gray-300 px-3 py-2"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={rescheduling}
                              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {rescheduling ? 'Čuvanje...' : 'Sačuvaj'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setRescheduleId(null)}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              Otkaži
                            </button>
                          </form>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {tests.length === 0 && (
                  <tr>
                    <td
                      colSpan={canSchedule ? 8 : 7}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      Nema zakazanih testova za izabrano odeljenje.
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
