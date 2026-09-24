import { type FormEvent, useEffect, useState } from 'react'

import { apiFetch, ApiError } from '@/shared/api/client'
import { useAuthStore } from '@/shared/auth/store'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Field, fieldControlClass, FormCard, FormGrid } from '@/shared/ui/Form'
import { IconPlus } from '@/shared/ui/icons'
import { FormErrors, Notice } from '@/shared/ui/Notice'
import { EmptyRow, Table, Tbody, Td, Th, Tr } from '@/shared/ui/Table'

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
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-ink font-serif">Školske godine</h2>
        {canCreate && !showForm && (
          <Button onClick={() => setShowForm(true)}>
            <IconPlus className="h-3.5 w-3.5" />
            Dodaj školsku godinu
          </Button>
        )}
      </div>

      {canCreate && showForm && (
        <FormCard
          title="Nova školska godina"
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
            <Field label="Naziv" htmlFor="sy_name">
              <input
                id="sy_name"
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={fieldControlClass}
              />
            </Field>

            <Field label="Početak" htmlFor="sy_starts_on">
              <input
                id="sy_starts_on"
                type="date"
                required
                value={startsOn}
                onChange={(event) => setStartsOn(event.target.value)}
                className={fieldControlClass}
              />
            </Field>

            <Field label="Kraj" htmlFor="sy_ends_on">
              <input
                id="sy_ends_on"
                type="date"
                required
                value={endsOn}
                onChange={(event) => setEndsOn(event.target.value)}
                className={fieldControlClass}
              />
            </Field>
          </FormGrid>

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Kreiranje...' : 'Kreiraj školsku godinu'}
          </Button>
        </FormCard>
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
                <Th>Naziv</Th>
                <Th>Početak</Th>
                <Th>Kraj</Th>
              </tr>
            </thead>
            <Tbody>
              {loading && <EmptyRow colSpan={3}>Učitavanje...</EmptyRow>}
              {!loading &&
                schoolYears.map((year) => (
                  <Tr key={year.id}>
                    <Td className="font-semibold text-ink">{year.name}</Td>
                    <Td>{year.starts_on}</Td>
                    <Td>{year.ends_on}</Td>
                  </Tr>
                ))}
              {!loading && schoolYears.length === 0 && (
                <EmptyRow colSpan={3}>Nema školskih godina.</EmptyRow>
              )}
            </Tbody>
          </Table>
        </Card>
      )}
    </section>
  )
}
