import { Fragment, type FormEvent, useEffect, useState } from 'react'

import { apiFetch, ApiError } from '@/shared/api/client'
import type { ClassGroup, User } from '@/shared/auth/types'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Field, fieldControlClass, FormCard, FormGrid } from '@/shared/ui/Form'
import { IconButton } from '@/shared/ui/IconButton'
import { IconEdit, IconPlus } from '@/shared/ui/icons'
import { FormErrors, Notice } from '@/shared/ui/Notice'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyRow, Table, Tbody, Td, Th, Tr } from '@/shared/ui/Table'

interface ClassGroupListItem extends ClassGroup {
  homeroom_teacher: { id: number; name: string } | null
  student_count: number
}

interface Teacher {
  id: number
  name: string
}

export function ClassGroupsPage() {
  const [classGroups, setClassGroups] = useState<ClassGroupListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [teachers, setTeachers] = useState<Teacher[]>([])

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [homeroomTeacherId, setHomeroomTeacherId] = useState('')
  const [formError, setFormError] = useState<ApiError | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editHomeroomTeacherId, setEditHomeroomTeacherId] = useState('')
  const [editError, setEditError] = useState<ApiError | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)

  useEffect(() => {
    void loadClassGroups()
  }, [])

  useEffect(() => {
    apiFetch<{ data: User[] }>('/api/v1/users?role=nastavnik,razredni_staresina')
      .then((result) => setTeachers(result.data.map((user) => ({ id: user.id, name: user.name }))))
      .catch(() => {
        // The homeroom-teacher selects just stay empty; a real failure surfaces
        // again (and is shown) when a form is submitted.
      })
  }, [])

  async function loadClassGroups() {
    setLoading(true)
    setListError(null)
    try {
      const result = await apiFetch<{ data: ClassGroupListItem[] }>('/api/v1/class-groups')
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
      await apiFetch<{ data: ClassGroupListItem }>('/api/v1/class-groups', {
        method: 'POST',
        body: {
          name,
          grade_level: Number(gradeLevel),
          ...(homeroomTeacherId ? { homeroom_teacher_id: Number(homeroomTeacherId) } : {}),
        },
      })
      setSuccessMessage('Odeljenje je kreirano.')
      setName('')
      setGradeLevel('')
      setHomeroomTeacherId('')
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

  function openEdit(group: ClassGroupListItem) {
    setEditingId(group.id)
    setEditHomeroomTeacherId(group.homeroom_teacher ? String(group.homeroom_teacher.id) : '')
    setEditError(null)
  }

  async function handleEditSubmit(event: FormEvent, groupId: number) {
    event.preventDefault()
    setEditError(null)
    setEditSubmitting(true)
    try {
      await apiFetch<{ data: ClassGroupListItem }>(`/api/v1/class-groups/${groupId}`, {
        method: 'PUT',
        body: { homeroom_teacher_id: editHomeroomTeacherId ? Number(editHomeroomTeacherId) : null },
      })
      setEditingId(null)
      await loadClassGroups()
    } catch (err) {
      if (err instanceof ApiError) {
        setEditError(err)
      } else {
        throw err
      }
    } finally {
      setEditSubmitting(false)
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

            <Field label="Razredni starešina" htmlFor="homeroom_teacher_id">
              <select
                id="homeroom_teacher_id"
                value={homeroomTeacherId}
                onChange={(event) => setHomeroomTeacherId(event.target.value)}
                className={fieldControlClass}
              >
                <option value="">Neopredeljeno</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
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
                <Th>Razredni starešina</Th>
                <Th>Broj učenika</Th>
                <Th />
              </tr>
            </thead>
            <Tbody>
              {loading && <EmptyRow colSpan={5}>Učitavanje...</EmptyRow>}
              {!loading &&
                classGroups.map((group) => (
                  <Fragment key={group.id}>
                    <Tr>
                      <Td className="font-semibold text-ink">{group.name}</Td>
                      <Td>{group.grade_level}</Td>
                      <Td>
                        {group.homeroom_teacher?.name ?? <span className="text-ink-faint">—</span>}
                      </Td>
                      <Td className="font-mono">{group.student_count}</Td>
                      <Td className="text-right">
                        <IconButton
                          title="Uredi razrednog starešinu"
                          onClick={() => openEdit(group)}
                        >
                          <IconEdit className="h-3.5 w-3.5" />
                        </IconButton>
                      </Td>
                    </Tr>
                    {editingId === group.id && (
                      <tr className="bg-surface-2">
                        <Td className="!py-4" colSpan={5}>
                          <form
                            onSubmit={(event) => void handleEditSubmit(event, group.id)}
                            className="space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-ink">
                                Razredni starešina - {group.name}
                              </h3>
                              <Button
                                type="button"
                                variant="text"
                                onClick={() => setEditingId(null)}
                              >
                                Otkaži
                              </Button>
                            </div>

                            {editError && <FormErrors error={editError} />}

                            <FormGrid>
                              <Field
                                label="Razredni starešina"
                                htmlFor={`edit_homeroom_${group.id}`}
                              >
                                <select
                                  id={`edit_homeroom_${group.id}`}
                                  value={editHomeroomTeacherId}
                                  onChange={(event) => setEditHomeroomTeacherId(event.target.value)}
                                  className={fieldControlClass}
                                >
                                  <option value="">Neopredeljeno</option>
                                  {teachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>
                                      {teacher.name}
                                    </option>
                                  ))}
                                </select>
                              </Field>
                            </FormGrid>

                            <Button type="submit" disabled={editSubmitting}>
                              {editSubmitting ? 'Čuvanje...' : 'Sačuvaj'}
                            </Button>
                          </form>
                        </Td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              {!loading && classGroups.length === 0 && (
                <EmptyRow colSpan={5}>Nema odeljenja.</EmptyRow>
              )}
            </Tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}
