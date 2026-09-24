import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiFetch, ApiError } from '@/shared/api/client'
import { useAuthStore } from '@/shared/auth/store'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Field, fieldControlClass, FormCard, FormGrid } from '@/shared/ui/Form'
import { IconPlus } from '@/shared/ui/icons'
import { FormErrors, Notice } from '@/shared/ui/Notice'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyRow, Table, Tbody, Td, Th, Tr } from '@/shared/ui/Table'

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
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Nastava"
        title="Predmeti"
        action={
          canCreate &&
          !showForm && (
            <Button onClick={() => setShowForm(true)}>
              <IconPlus className="h-3.5 w-3.5" />
              Dodaj predmet
            </Button>
          )
        }
      />

      {canCreate && showForm && (
        <FormCard title="Novi predmet" onCancel={() => setShowForm(false)} onSubmit={handleCreate}>
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
          </FormGrid>

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Kreiranje...' : 'Kreiraj predmet'}
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
                <Th>Lekcije</Th>
              </tr>
            </thead>
            <Tbody>
              {loading && <EmptyRow colSpan={2}>Učitavanje...</EmptyRow>}
              {!loading &&
                subjects.map((subject) => (
                  <Tr key={subject.id}>
                    <Td className="font-semibold text-ink">{subject.name}</Td>
                    <Td>
                      <Link
                        to={`/subjects/${subject.id}/lessons`}
                        className="font-medium text-accent hover:underline"
                      >
                        Prikaži lekcije
                      </Link>
                    </Td>
                  </Tr>
                ))}
              {!loading && subjects.length === 0 && <EmptyRow colSpan={2}>Nema predmeta.</EmptyRow>}
            </Tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}
