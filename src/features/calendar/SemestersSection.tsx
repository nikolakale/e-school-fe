import { type FormEvent, useEffect, useState } from 'react'

import { apiFetch, ApiError } from '@/shared/api/client'
import { useAuthStore } from '@/shared/auth/store'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Field, fieldControlClass, FormCard, FormGrid } from '@/shared/ui/Form'
import { IconPlus } from '@/shared/ui/icons'
import { FormErrors, Notice } from '@/shared/ui/Notice'
import { EmptyRow, Table, Tbody, Td, Th, Tr } from '@/shared/ui/Table'

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
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-ink font-serif">Polugodišta</h2>
        {canCreate && !showForm && (
          <Button onClick={openForm}>
            <IconPlus className="h-3.5 w-3.5" />
            Dodaj polugodište
          </Button>
        )}
      </div>

      {canCreate && showForm && (
        <FormCard
          title="Novo polugodište"
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
            <Field label="Školska godina" htmlFor="sem_school_year_id">
              <select
                id="sem_school_year_id"
                required
                value={formSchoolYearId}
                onChange={(event) => setFormSchoolYearId(event.target.value)}
                className={fieldControlClass}
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
            </Field>

            <Field label="Broj polugodišta" htmlFor="sem_number">
              <select
                id="sem_number"
                value={number}
                onChange={(event) => setNumber(event.target.value as '1' | '2')}
                className={fieldControlClass}
              >
                <option value="1">Prvo</option>
                <option value="2">Drugo</option>
              </select>
            </Field>

            <Field label="Početak" htmlFor="sem_starts_on">
              <input
                id="sem_starts_on"
                type="date"
                required
                value={startsOn}
                onChange={(event) => setStartsOn(event.target.value)}
                className={fieldControlClass}
              />
            </Field>

            <Field label="Kraj" htmlFor="sem_ends_on">
              <input
                id="sem_ends_on"
                type="date"
                required
                value={endsOn}
                onChange={(event) => setEndsOn(event.target.value)}
                className={fieldControlClass}
              />
            </Field>

            <Field label="Kraj 1. tromesečja (opciono)" htmlFor="sem_trimester_1_ends_on">
              <input
                id="sem_trimester_1_ends_on"
                type="date"
                value={trimester1EndsOn}
                onChange={(event) => setTrimester1EndsOn(event.target.value)}
                className={fieldControlClass}
              />
            </Field>

            <Field label="Kraj 2. tromesečja (opciono)" htmlFor="sem_trimester_2_ends_on">
              <input
                id="sem_trimester_2_ends_on"
                type="date"
                value={trimester2EndsOn}
                onChange={(event) => setTrimester2EndsOn(event.target.value)}
                className={fieldControlClass}
              />
            </Field>
          </FormGrid>

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Kreiranje...' : 'Kreiraj polugodište'}
          </Button>
        </FormCard>
      )}

      <div className="mb-3 flex flex-col gap-1.5" style={{ maxWidth: 260 }}>
        <label htmlFor="sem_filter_school_year_id" className="text-xs font-semibold text-ink-muted">
          Prikaži za školsku godinu
        </label>
        <select
          id="sem_filter_school_year_id"
          value={selectedSchoolYearId}
          onChange={(event) => setSelectedSchoolYearId(event.target.value)}
          className={fieldControlClass}
        >
          {schoolYears.length === 0 && <option value="">Nema školskih godina</option>}
          {schoolYears.map((year) => (
            <option key={year.id} value={year.id}>
              {year.name}
            </option>
          ))}
        </select>
      </div>

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
                <Th>Polugodište</Th>
                <Th>Početak</Th>
                <Th>Kraj</Th>
                <Th>Kraj 1. trom.</Th>
                <Th>Kraj 2. trom.</Th>
              </tr>
            </thead>
            <Tbody>
              {loading && <EmptyRow colSpan={5}>Učitavanje...</EmptyRow>}
              {!loading &&
                semesters.map((semester) => (
                  <Tr key={semester.id}>
                    <Td className="font-semibold text-ink">
                      {semester.number === 1 ? 'Prvo' : 'Drugo'}
                    </Td>
                    <Td>{semester.starts_on}</Td>
                    <Td>{semester.ends_on}</Td>
                    <Td>
                      {semester.trimester_1_ends_on ?? <span className="text-ink-faint">—</span>}
                    </Td>
                    <Td>
                      {semester.trimester_2_ends_on ?? <span className="text-ink-faint">—</span>}
                    </Td>
                  </Tr>
                ))}
              {!loading && semesters.length === 0 && (
                <EmptyRow colSpan={5}>Nema polugodišta za izabranu školsku godinu.</EmptyRow>
              )}
            </Tbody>
          </Table>
        </Card>
      )}
    </section>
  )
}
