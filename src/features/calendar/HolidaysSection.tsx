import { type FormEvent, useEffect, useState } from 'react'

import { apiFetch, ApiError } from '@/shared/api/client'
import { useAuthStore } from '@/shared/auth/store'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Field, fieldControlClass, FormCard, FormGrid } from '@/shared/ui/Form'
import { IconPlus } from '@/shared/ui/icons'
import { FormErrors, Notice } from '@/shared/ui/Notice'
import { EmptyRow, Table, Tbody, Td, Th, Tr } from '@/shared/ui/Table'

import type { Holiday, SchoolYear } from './types'

/**
 * Praznici/raspusti: viewing is scoped to a chosen školska godina (the list
 * endpoint is filtered by school_year_id), create form visible to Direktor
 * only.
 */
export function HolidaysSection() {
  const user = useAuthStore((state) => state.user)
  const canCreate = user?.role.slug === 'direktor'

  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([])
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState('')

  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [showForm, setShowForm] = useState(false)
  const [formSchoolYearId, setFormSchoolYearId] = useState('')
  const [name, setName] = useState('')
  const [startsOn, setStartsOn] = useState('')
  const [endsOn, setEndsOn] = useState('')
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
        // (and is shown) once a year can be selected and its holidays load.
      }
    }
    void loadSchoolYears()
  }, [])

  useEffect(() => {
    async function loadHolidays() {
      if (!selectedSchoolYearId) {
        setHolidays([])
        return
      }

      setLoading(true)
      setListError(null)
      try {
        const result = await apiFetch<{ data: Holiday[] }>(
          `/api/v1/holidays?school_year_id=${selectedSchoolYearId}`,
        )
        setHolidays(result.data)
      } catch (err) {
        setListError(err instanceof ApiError ? err.message : 'Greška pri učitavanju praznika.')
      } finally {
        setLoading(false)
      }
    }

    void loadHolidays()
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
      await apiFetch<{ data: Holiday }>('/api/v1/holidays', {
        method: 'POST',
        body: {
          school_year_id: Number(formSchoolYearId),
          name,
          starts_on: startsOn,
          ends_on: endsOn,
        },
      })
      setSuccessMessage('Praznik/raspust je kreiran.')
      setName('')
      setStartsOn('')
      setEndsOn('')
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
        <h2 className="text-[18px] font-semibold text-ink font-serif">Praznici</h2>
        {canCreate && !showForm && (
          <Button onClick={openForm}>
            <IconPlus className="h-3.5 w-3.5" />
            Dodaj praznik
          </Button>
        )}
      </div>

      {canCreate && showForm && (
        <FormCard
          title="Novi praznik/raspust"
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
            <Field label="Školska godina" htmlFor="hol_school_year_id">
              <select
                id="hol_school_year_id"
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

            <Field label="Naziv" htmlFor="hol_name">
              <input
                id="hol_name"
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={fieldControlClass}
              />
            </Field>

            <Field label="Početak" htmlFor="hol_starts_on">
              <input
                id="hol_starts_on"
                type="date"
                required
                value={startsOn}
                onChange={(event) => setStartsOn(event.target.value)}
                className={fieldControlClass}
              />
            </Field>

            <Field label="Kraj" htmlFor="hol_ends_on">
              <input
                id="hol_ends_on"
                type="date"
                required
                value={endsOn}
                onChange={(event) => setEndsOn(event.target.value)}
                className={fieldControlClass}
              />
            </Field>
          </FormGrid>

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Kreiranje...' : 'Kreiraj praznik'}
          </Button>
        </FormCard>
      )}

      <div className="mb-3 flex flex-col gap-1.5" style={{ maxWidth: 260 }}>
        <label htmlFor="hol_filter_school_year_id" className="text-xs font-semibold text-ink-muted">
          Prikaži za školsku godinu
        </label>
        <select
          id="hol_filter_school_year_id"
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
                <Th>Naziv</Th>
                <Th>Početak</Th>
                <Th>Kraj</Th>
              </tr>
            </thead>
            <Tbody>
              {loading && <EmptyRow colSpan={3}>Učitavanje...</EmptyRow>}
              {!loading &&
                holidays.map((holiday) => (
                  <Tr key={holiday.id}>
                    <Td className="font-semibold text-ink">{holiday.name}</Td>
                    <Td>{holiday.starts_on}</Td>
                    <Td>{holiday.ends_on}</Td>
                  </Tr>
                ))}
              {!loading && holidays.length === 0 && (
                <EmptyRow colSpan={3}>Nema praznika za izabranu školsku godinu.</EmptyRow>
              )}
            </Tbody>
          </Table>
        </Card>
      )}
    </section>
  )
}
