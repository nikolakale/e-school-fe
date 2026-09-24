import { type FormEvent, useEffect, useState } from 'react'

import { apiFetch, ApiError } from '@/shared/api/client'
import type { ClassGroup } from '@/shared/auth/types'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Field, fieldControlClass, FormCard, FormGrid } from '@/shared/ui/Form'
import { IconPlus } from '@/shared/ui/icons'
import { FormErrors, Notice } from '@/shared/ui/Notice'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyRow, Table, Tbody, Td, Th, Tr } from '@/shared/ui/Table'

export function ClassGroupsPage() {
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
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
      setShowForm(false)
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
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Administracija"
        title="Odeljenja"
        action={
          !showForm && (
            <Button onClick={() => setShowForm(true)}>
              <IconPlus className="h-3.5 w-3.5" />
              Dodaj odeljenje
            </Button>
          )
        }
      />

      {showForm && (
        <FormCard
          title="Novo odeljenje"
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
            <Field label="Naziv" htmlFor="name">
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={fieldControlClass}
              />
            </Field>

            <Field label="Razred" htmlFor="grade_level">
              <input
                id="grade_level"
                type="number"
                required
                min={1}
                value={gradeLevel}
                onChange={(event) => setGradeLevel(event.target.value)}
                className={fieldControlClass}
              />
            </Field>
          </FormGrid>

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Kreiranje...' : 'Kreiraj odeljenje'}
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
                <Th>Razred</Th>
              </tr>
            </thead>
            <Tbody>
              {loading && <EmptyRow colSpan={2}>Učitavanje...</EmptyRow>}
              {!loading &&
                classGroups.map((group) => (
                  <Tr key={group.id}>
                    <Td className="font-semibold text-ink">{group.name}</Td>
                    <Td>{group.grade_level}</Td>
                  </Tr>
                ))}
              {!loading && classGroups.length === 0 && (
                <EmptyRow colSpan={2}>Nema odeljenja.</EmptyRow>
              )}
            </Tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}
