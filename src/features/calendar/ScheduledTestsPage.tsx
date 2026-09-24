import { Fragment, type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiFetch, ApiError } from '@/shared/api/client'
import { useAuthStore } from '@/shared/auth/store'
import type { ClassGroup } from '@/shared/auth/types'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Field, fieldControlClass, FormCard, FormGrid } from '@/shared/ui/Form'
import { IconInfo, IconPlus } from '@/shared/ui/icons'
import { FormErrors, Notice } from '@/shared/ui/Notice'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyRow, Table, Tbody, Td, Th, Tr } from '@/shared/ui/Table'

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

/**
 * A student's action for one test: nothing to click before it opens, a link
 * into the attempt once it's open or closed - whether that resumes an
 * in-progress attempt, shows an already-submitted one, or (for a test the
 * student never started, past its window) surfaces the BE's own error is up
 * to TakeTestPage, not this list.
 */
function StudentTestAction({ test }: { test: ScheduledTest }) {
  const now = new Date()
  if (now < new Date(test.available_from)) {
    return <span className="text-[12.5px] text-ink-faint">Uskoro</span>
  }

  const closed = now > new Date(test.available_until)
  return (
    <Link
      to={`/tests/${test.id}`}
      className="text-[12.5px] font-semibold text-accent hover:underline"
    >
      {closed ? 'Pogledaj' : 'Polaži test'}
    </Link>
  )
}

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
  const isUcenik = user?.role.slug === 'ucenik'

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
  // A student's own odeljenje is the sensible default - everyone else starts on the first one.
  useEffect(() => {
    async function loadClassGroups() {
      try {
        const result = await apiFetch<{ data: ClassGroup[] }>('/api/v1/class-groups')
        setClassGroups(result.data)
        setSelectedClassGroupId(
          (current) => current || String(user?.class_group?.id ?? result.data[0]?.id ?? ''),
        )
      } catch {
        // The picker just stays empty; the page below shows nothing to pick.
      }
    }
    void loadClassGroups()
  }, [user?.class_group?.id])

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

  const showActionColumn = canSchedule || isUcenik
  const columnCount = showActionColumn ? 8 : 7

  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Nastava"
        title="Zakazani testovi"
        action={
          canSchedule &&
          !showForm && (
            <Button onClick={openForm}>
              <IconPlus className="h-3.5 w-3.5" />
              Zakazivanje testa
            </Button>
          )
        }
      />

      {canSchedule && showForm && (
        <FormCard
          title="Zakazivanje testa"
          onCancel={() => setShowForm(false)}
          onSubmit={handleCreate}
        >
          {successMessage && (
            <div className="mb-4">
              <Notice variant="success">{successMessage}</Notice>
            </div>
          )}
          {formError && (
            <div className="mb-4">
              <FormErrors error={formError} />
            </div>
          )}

          <FormGrid>
            <Field label="Predmet" htmlFor="st_subject_id">
              <select
                id="st_subject_id"
                required
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
                className={fieldControlClass}
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
            </Field>

            <Field label="Odeljenje" htmlFor="st_class_group_id">
              <select
                id="st_class_group_id"
                required
                value={formClassGroupId}
                onChange={(event) => setFormClassGroupId(event.target.value)}
                className={fieldControlClass}
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
            </Field>

            <Field label="Semestar" htmlFor="st_semester_id">
              <select
                id="st_semester_id"
                required
                value={semesterId}
                onChange={(event) => setSemesterId(event.target.value)}
                className={fieldControlClass}
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
            </Field>

            <Field label="Tip" htmlFor="st_type">
              <select
                id="st_type"
                value={type}
                onChange={(event) => setType(event.target.value as ScheduledTestType)}
                className={fieldControlClass}
              >
                {TEST_TYPES.map((testType) => (
                  <option key={testType} value={testType}>
                    {SCHEDULED_TEST_TYPE_LABELS[testType]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Dostupan od" htmlFor="st_available_from">
              <input
                id="st_available_from"
                type="datetime-local"
                required
                value={availableFrom}
                onChange={(event) => setAvailableFrom(event.target.value)}
                className={fieldControlClass}
              />
            </Field>

            <Field label="Dostupan do" htmlFor="st_available_until">
              <input
                id="st_available_until"
                type="datetime-local"
                required
                value={availableUntil}
                onChange={(event) => setAvailableUntil(event.target.value)}
                className={fieldControlClass}
              />
            </Field>

            <Field label="Trajanje (min, opciono)" htmlFor="st_duration_minutes">
              <input
                id="st_duration_minutes"
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                className={fieldControlClass}
              />
            </Field>
          </FormGrid>

          <div className="mb-4 flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2">
              <input
                id="st_retake_allowed"
                type="checkbox"
                checked={retakeAllowed}
                onChange={(event) => setRetakeAllowed(event.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor="st_retake_allowed" className="text-[13.5px] font-medium text-ink">
                Popravni dozvoljen
              </label>
            </div>

            {retakeAllowed && (
              <Field
                label="Dana čekanja do popravnog"
                htmlFor="st_retake_wait_days"
                style={{ flex: '0 1 200px' }}
              >
                <input
                  id="st_retake_wait_days"
                  type="number"
                  required
                  min={0}
                  value={retakeWaitDays}
                  onChange={(event) => setRetakeWaitDays(event.target.value)}
                  className={fieldControlClass}
                />
              </Field>
            )}
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Zakazivanje...' : 'Zakaži test'}
          </Button>
        </FormCard>
      )}

      <div className="mb-4 flex flex-col gap-1.5" style={{ maxWidth: 260 }}>
        <label htmlFor="st_class_group_filter" className="text-xs font-semibold text-ink-muted">
          Odeljenje
        </label>
        <select
          id="st_class_group_filter"
          value={selectedClassGroupId}
          onChange={(event) => setSelectedClassGroupId(event.target.value)}
          className={fieldControlClass}
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
        <div className="mb-4 flex max-w-xl gap-2.5 rounded-lg border border-dashed border-border px-3.5 py-3 text-[12.5px] text-ink-muted">
          <IconInfo className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
          <div>
            <p className="font-semibold text-ink">Praznici u tekućoj školskoj godini</p>
            <ul className="mt-1 list-inside list-disc">
              {holidays.map((holiday) => (
                <li key={holiday.id}>
                  {holiday.name}: {holiday.starts_on} - {holiday.ends_on}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {listError && (
        <div className="mb-3">
          <Notice variant="danger">{listError}</Notice>
        </div>
      )}

      {!listError && (
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>Predmet</Th>
                <Th>Tip</Th>
                <Th>Dostupan od</Th>
                <Th>Dostupan do</Th>
                <Th>Trajanje</Th>
                <Th>Popravni</Th>
                <Th>Zakazao</Th>
                {showActionColumn && <Th />}
              </tr>
            </thead>
            <Tbody>
              {loading && <EmptyRow colSpan={columnCount}>Učitavanje...</EmptyRow>}
              {!loading &&
                tests.map((test) => (
                  <Fragment key={test.id}>
                    <Tr>
                      <Td className="font-semibold text-ink">{test.subject.name}</Td>
                      <Td>{SCHEDULED_TEST_TYPE_LABELS[test.type]}</Td>
                      <Td>{new Date(test.available_from).toLocaleString('sr-RS')}</Td>
                      <Td>{new Date(test.available_until).toLocaleString('sr-RS')}</Td>
                      <Td>{test.duration_minutes ?? <span className="text-ink-faint">—</span>}</Td>
                      <Td>
                        {test.retake_allowed ? `Da (${test.retake_wait_days ?? '-'} d.)` : 'Ne'}
                      </Td>
                      <Td>{test.scheduled_by.name}</Td>
                      {showActionColumn && (
                        <Td className="text-right">
                          {canSchedule && (
                            <button
                              type="button"
                              onClick={() => openReschedule(test)}
                              className="text-[12.5px] font-semibold text-accent hover:underline"
                            >
                              Pomeri
                            </button>
                          )}
                          {isUcenik && <StudentTestAction test={test} />}
                        </Td>
                      )}
                    </Tr>
                    {rescheduleId === test.id && (
                      <tr className="bg-surface-2">
                        <Td className="!py-3.5" colSpan={columnCount}>
                          <form
                            onSubmit={handleReschedule}
                            className="flex flex-wrap items-end gap-3.5"
                          >
                            {rescheduleError && (
                              <div className="w-full">
                                <FormErrors error={rescheduleError} />
                              </div>
                            )}

                            <Field label="Dostupan od" htmlFor={`reschedule_from_${test.id}`}>
                              <input
                                id={`reschedule_from_${test.id}`}
                                type="datetime-local"
                                required
                                value={rescheduleFrom}
                                onChange={(event) => setRescheduleFrom(event.target.value)}
                                className={fieldControlClass}
                              />
                            </Field>

                            <Field label="Dostupan do" htmlFor={`reschedule_until_${test.id}`}>
                              <input
                                id={`reschedule_until_${test.id}`}
                                type="datetime-local"
                                required
                                value={rescheduleUntil}
                                onChange={(event) => setRescheduleUntil(event.target.value)}
                                className={fieldControlClass}
                              />
                            </Field>

                            <Button type="submit" disabled={rescheduling}>
                              {rescheduling ? 'Čuvanje...' : 'Sačuvaj'}
                            </Button>
                            <Button
                              type="button"
                              variant="text"
                              onClick={() => setRescheduleId(null)}
                            >
                              Otkaži
                            </Button>
                          </form>
                        </Td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              {!loading && tests.length === 0 && (
                <EmptyRow colSpan={columnCount}>
                  Nema zakazanih testova za izabrano odeljenje.
                </EmptyRow>
              )}
            </Tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}
