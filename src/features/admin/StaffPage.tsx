import { Fragment, type ChangeEvent, type FormEvent, useEffect, useState } from 'react'

import { apiFetch, ApiError } from '@/shared/api/client'
import { RoleBadge } from '@/shared/auth/RoleBadge'
import type { RoleSlug, User } from '@/shared/auth/types'
import { Button } from '@/shared/ui/Button'
import { Card, CardFoot } from '@/shared/ui/Card'
import { Field, fieldControlClass, FormCard, FormGrid } from '@/shared/ui/Form'
import { IconButton } from '@/shared/ui/IconButton'
import { IconPlus, IconTeachingAssignments } from '@/shared/ui/icons'
import { FormErrors, Notice } from '@/shared/ui/Notice'
import { Pager, type PaginationMeta } from '@/shared/ui/Pager'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyRow, Table, Tbody, Td, Th, Tr } from '@/shared/ui/Table'

interface PaginatedUsers {
  data: User[]
  meta: PaginationMeta
}

interface Subject {
  id: number
  name: string
}

interface ClassGroup {
  id: number
  name: string
}

/** Roles a teaching assignment (subjects + odeljenja) can be set for. */
const ASSIGNABLE_ROLES: RoleSlug[] = ['nastavnik', 'razredni_staresina']

/** Every non-student, non-parent role. */
const STAFF_ROLES = 'nastavnik,razredni_staresina,direktor,strucni_saradnik'

function selectedOptionIds(event: ChangeEvent<HTMLSelectElement>): number[] {
  return Array.from(event.target.selectedOptions, (option) => Number(option.value))
}

export function StaffPage() {
  const [staff, setStaff] = useState<User[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [classGroups, setClassGroups] = useState<ClassGroup[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState<ApiError | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [assignmentsUserId, setAssignmentsUserId] = useState<number | null>(null)
  const [assignmentSubjectIds, setAssignmentSubjectIds] = useState<number[]>([])
  const [assignmentClassGroupIds, setAssignmentClassGroupIds] = useState<number[]>([])
  const [assignmentError, setAssignmentError] = useState<ApiError | null>(null)
  const [assignmentSuccess, setAssignmentSuccess] = useState<string | null>(null)
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false)

  useEffect(() => {
    void loadStaff(page)
  }, [page])

  useEffect(() => {
    apiFetch<{ data: ClassGroup[] }>('/api/v1/class-groups')
      .then((result) => setClassGroups(result.data))
      .catch(() => {
        // The teaching-assignments editor's class-group select just stays empty.
      })
    apiFetch<{ data: Subject[] }>('/api/v1/subjects')
      .then((result) => setSubjects(result.data))
      .catch(() => {
        // The teaching-assignments editor's subject select just stays empty.
      })
  }, [])

  async function loadStaff(targetPage: number) {
    setLoading(true)
    setListError(null)
    try {
      const result = await apiFetch<PaginatedUsers>(
        `/api/v1/users?role=${STAFF_ROLES}&page=${targetPage}`,
      )
      setStaff(result.data)
      setMeta(result.meta)
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Greška pri učitavanju osoblja.')
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
      // Only "nastavnik" is creatable through this form - the API doesn't (yet)
      // support creating direktor/strucni_saradnik/razredni_staresina accounts.
      await apiFetch<{ data: User }>('/api/v1/users', {
        method: 'POST',
        body: { name, email, role: 'nastavnik' },
      })
      setSuccessMessage('Nalog je kreiran - mejl sa linkom za postavljanje lozinke je poslat.')
      setName('')
      setEmail('')
      setShowForm(false)
      setPage(1)
      await loadStaff(1)
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

  function openAssignments(user: User) {
    setAssignmentsUserId(user.id)
    // The API has no GET for a user's current assignments, so the selects
    // just start empty - a documented, acceptable limitation, not a bug.
    setAssignmentSubjectIds([])
    setAssignmentClassGroupIds([])
    setAssignmentError(null)
    setAssignmentSuccess(null)
  }

  async function handleAssignmentsSubmit(event: FormEvent, userId: number) {
    event.preventDefault()
    setAssignmentError(null)
    setAssignmentSuccess(null)
    setAssignmentSubmitting(true)
    try {
      const result = await apiFetch<{ message: string }>(
        `/api/v1/users/${userId}/teaching-assignments`,
        {
          method: 'PUT',
          body: { subject_ids: assignmentSubjectIds, class_group_ids: assignmentClassGroupIds },
        },
      )
      setAssignmentSuccess(result.message ?? 'Zaduženja su sačuvana.')
    } catch (err) {
      if (err instanceof ApiError) {
        setAssignmentError(err)
      } else {
        throw err
      }
    } finally {
      setAssignmentSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Administracija"
        title="Osoblje"
        subtitle={meta ? `${meta.total} zaposlenih` : undefined}
        action={
          !showForm && (
            <Button onClick={() => setShowForm(true)}>
              <IconPlus className="h-3.5 w-3.5" />
              Dodaj nastavnika
            </Button>
          )
        }
      />

      {showForm && (
        <FormCard
          title="Novi nastavnik"
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
            <Field label="Ime i prezime" htmlFor="name">
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={fieldControlClass}
              />
            </Field>

            <Field label="Email" htmlFor="email">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={fieldControlClass}
              />
            </Field>
          </FormGrid>

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Kreiranje...' : 'Kreiraj nastavnika'}
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
                <Th>Ime</Th>
                <Th>Uloga</Th>
                <Th>Odeljenje</Th>
                <Th />
              </tr>
            </thead>
            <Tbody>
              {loading && <EmptyRow colSpan={4}>Učitavanje...</EmptyRow>}
              {!loading &&
                staff.map((user) => (
                  <Fragment key={user.id}>
                    <Tr>
                      <Td>
                        <div className="font-semibold text-ink">{user.name}</div>
                        <div className="text-[12.5px] text-ink-muted font-mono">{user.email}</div>
                      </Td>
                      <Td>
                        <RoleBadge role={user.role} />
                      </Td>
                      <Td>{user.class_group?.name ?? <span className="text-ink-faint">—</span>}</Td>
                      <Td className="text-right">
                        {ASSIGNABLE_ROLES.includes(user.role.slug) && (
                          <div className="flex justify-end gap-1.5">
                            <IconButton
                              title="Predmeti/odeljenja"
                              onClick={() => openAssignments(user)}
                            >
                              <IconTeachingAssignments className="h-3.5 w-3.5" />
                            </IconButton>
                          </div>
                        )}
                      </Td>
                    </Tr>
                    {assignmentsUserId === user.id && (
                      <tr className="bg-surface-2">
                        <Td className="!py-4" colSpan={4}>
                          <form
                            onSubmit={(event) => void handleAssignmentsSubmit(event, user.id)}
                            className="space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-ink">
                                Zaduženja - {user.name}
                              </h3>
                              <Button
                                type="button"
                                variant="text"
                                onClick={() => setAssignmentsUserId(null)}
                              >
                                Otkaži
                              </Button>
                            </div>

                            {assignmentSuccess && (
                              <Notice variant="success">{assignmentSuccess}</Notice>
                            )}
                            {assignmentError && <FormErrors error={assignmentError} />}

                            <p className="text-xs text-ink-muted">
                              Napomena: API ne vraća trenutna zaduženja, pa liste ispod uvek kreću
                              prazne - čuvanje zamenjuje kompletan spisak zaduženja.
                            </p>

                            <FormGrid>
                              <Field label="Predmeti" htmlFor={`assignment_subjects_${user.id}`}>
                                <select
                                  id={`assignment_subjects_${user.id}`}
                                  multiple
                                  value={assignmentSubjectIds.map(String)}
                                  onChange={(event) =>
                                    setAssignmentSubjectIds(selectedOptionIds(event))
                                  }
                                  className={fieldControlClass + ' h-32'}
                                >
                                  {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                      {subject.name}
                                    </option>
                                  ))}
                                </select>
                              </Field>

                              <Field
                                label="Odeljenja"
                                htmlFor={`assignment_class_groups_${user.id}`}
                              >
                                <select
                                  id={`assignment_class_groups_${user.id}`}
                                  multiple
                                  value={assignmentClassGroupIds.map(String)}
                                  onChange={(event) =>
                                    setAssignmentClassGroupIds(selectedOptionIds(event))
                                  }
                                  className={fieldControlClass + ' h-32'}
                                >
                                  {classGroups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                      {group.name}
                                    </option>
                                  ))}
                                </select>
                              </Field>
                            </FormGrid>

                            <Button type="submit" disabled={assignmentSubmitting}>
                              {assignmentSubmitting ? 'Čuvanje...' : 'Sačuvaj zaduženja'}
                            </Button>
                          </form>
                        </Td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              {!loading && staff.length === 0 && <EmptyRow colSpan={4}>Nema zaposlenih.</EmptyRow>}
            </Tbody>
          </Table>
          {meta && meta.last_page > 1 && (
            <CardFoot>
              <Pager
                meta={meta}
                onPrev={() => setPage((current) => current - 1)}
                onNext={() => setPage((current) => current + 1)}
              />
            </CardFoot>
          )}
        </Card>
      )}
    </div>
  )
}
