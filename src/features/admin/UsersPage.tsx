import { Fragment, type ChangeEvent, type FormEvent, useEffect, useState } from 'react'

import { apiFetch, ApiError } from '@/shared/api/client'
import { RoleBadge } from '@/shared/auth/RoleBadge'
import type { ClassGroup, RoleSlug, User } from '@/shared/auth/types'
import { Button } from '@/shared/ui/Button'
import { Card, CardFoot } from '@/shared/ui/Card'
import { Field, fieldControlClass, FormCard, FormGrid } from '@/shared/ui/Form'
import { IconButton } from '@/shared/ui/IconButton'
import { IconPlus, IconTeachingAssignments } from '@/shared/ui/icons'
import { FormErrors, Notice } from '@/shared/ui/Notice'
import { Pager, type PaginationMeta } from '@/shared/ui/Pager'
import { EmptyRow, Table, Tbody, Td, Th, Tr } from '@/shared/ui/Table'
import { PageHeader } from '@/shared/ui/PageHeader'

import { AddParentToStudentForm } from './AddParentToStudentForm'

interface PaginatedUsers {
  data: User[]
  meta: PaginationMeta
}

interface Subject {
  id: number
  name: string
}

type CreatableRole = Extract<RoleSlug, 'ucenik' | 'nastavnik'>

/** Roles a teaching assignment (subjects + odeljenja) can be set for. */
const ASSIGNABLE_ROLES: RoleSlug[] = ['nastavnik', 'razredni_staresina']

/** "Osoblje" section: every non-student, non-parent role. */
const STAFF_ROLES = 'nastavnik,razredni_staresina,direktor,strucni_saradnik'

function selectedOptionIds(event: ChangeEvent<HTMLSelectElement>): number[] {
  return Array.from(event.target.selectedOptions, (option) => Number(option.value))
}

interface UserListState {
  users: User[]
  meta: PaginationMeta | null
  page: number
  loading: boolean
  error: string | null
}

const INITIAL_LIST_STATE: UserListState = {
  users: [],
  meta: null,
  page: 1,
  loading: false,
  error: null,
}

export function UsersPage() {
  const [staff, setStaff] = useState<UserListState>(INITIAL_LIST_STATE)
  const [students, setStudents] = useState<UserListState>(INITIAL_LIST_STATE)

  const [classGroups, setClassGroups] = useState<ClassGroup[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<CreatableRole>('ucenik')
  const [classGroupId, setClassGroupId] = useState('')
  const [formError, setFormError] = useState<ApiError | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [assignmentsUserId, setAssignmentsUserId] = useState<number | null>(null)
  const [assignmentSubjectIds, setAssignmentSubjectIds] = useState<number[]>([])
  const [assignmentClassGroupIds, setAssignmentClassGroupIds] = useState<number[]>([])
  const [assignmentError, setAssignmentError] = useState<ApiError | null>(null)
  const [assignmentSuccess, setAssignmentSuccess] = useState<string | null>(null)
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false)

  const [addParentUserId, setAddParentUserId] = useState<number | null>(null)
  const [parentInviteConfirmation, setParentInviteConfirmation] = useState<{
    userId: number
    message: string
  } | null>(null)

  async function loadStaff(targetPage: number) {
    setStaff((current) => ({ ...current, loading: true, error: null }))
    try {
      const result = await apiFetch<PaginatedUsers>(
        `/api/v1/users?role=${STAFF_ROLES}&page=${targetPage}`,
      )
      setStaff({
        users: result.data,
        meta: result.meta,
        page: targetPage,
        loading: false,
        error: null,
      })
    } catch (err) {
      setStaff((current) => ({
        ...current,
        loading: false,
        error: err instanceof ApiError ? err.message : 'Greška pri učitavanju osoblja.',
      }))
    }
  }

  async function loadStudents(targetPage: number) {
    setStudents((current) => ({ ...current, loading: true, error: null }))
    try {
      const result = await apiFetch<PaginatedUsers>(`/api/v1/users?role=ucenik&page=${targetPage}`)
      setStudents({
        users: result.data,
        meta: result.meta,
        page: targetPage,
        loading: false,
        error: null,
      })
    } catch (err) {
      setStudents((current) => ({
        ...current,
        loading: false,
        error: err instanceof ApiError ? err.message : 'Greška pri učitavanju učenika.',
      }))
    }
  }

  useEffect(() => {
    void loadStaff(staff.page)
  }, [staff.page])

  useEffect(() => {
    void loadStudents(students.page)
  }, [students.page])

  useEffect(() => {
    apiFetch<{ data: ClassGroup[] }>('/api/v1/class-groups')
      .then((result) => setClassGroups(result.data))
      .catch(() => {
        // The create form's class-group select just stays empty; a real
        // failure surfaces again (and is shown) when the form is submitted.
      })
    apiFetch<{ data: Subject[] }>('/api/v1/subjects')
      .then((result) => setSubjects(result.data))
      .catch(() => {
        // The teaching-assignments editor's subject select just stays empty.
      })
  }, [])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setSuccessMessage(null)
    setSubmitting(true)
    try {
      await apiFetch<{ data: User }>('/api/v1/users', {
        method: 'POST',
        body: {
          name,
          email,
          role,
          ...(role === 'ucenik' ? { class_group_id: Number(classGroupId) } : {}),
        },
      })
      setSuccessMessage('Nalog je kreiran - mejl sa linkom za postavljanje lozinke je poslat.')
      setName('')
      setEmail('')
      setClassGroupId('')
      setShowForm(false)
      if (role === 'ucenik') {
        setStudents((current) => ({ ...current, page: 1 }))
        await loadStudents(1)
      } else {
        setStaff((current) => ({ ...current, page: 1 }))
        await loadStaff(1)
      }
      setRole('ucenik')
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

  function openAddParent(studentId: number) {
    setAddParentUserId(studentId)
    setParentInviteConfirmation(null)
  }

  function handleParentInviteSuccess(studentId: number, message: string) {
    setParentInviteConfirmation({ userId: studentId, message })
    setAddParentUserId(null)
  }

  const totalUsers = (staff.meta?.total ?? 0) + (students.meta?.total ?? 0)

  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow="Administracija"
        title="Korisnici"
        subtitle={
          staff.meta || students.meta
            ? `${totalUsers} naloga · učenici, nastavnici i ostale uloge u sistemu`
            : undefined
        }
        action={
          !showForm && (
            <Button onClick={() => setShowForm(true)}>
              <IconPlus className="h-3.5 w-3.5" />
              Dodaj korisnika
            </Button>
          )
        }
      />

      {showForm && (
        <FormCard title="Novi korisnik" onCancel={() => setShowForm(false)} onSubmit={handleCreate}>
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

            <Field label="Uloga" htmlFor="role" style={{ flex: '0 1 160px' }}>
              <select
                id="role"
                value={role}
                onChange={(event) => setRole(event.target.value as CreatableRole)}
                className={fieldControlClass}
              >
                <option value="ucenik">Učenik</option>
                <option value="nastavnik">Nastavnik</option>
              </select>
            </Field>

            {role === 'ucenik' && (
              <Field label="Odeljenje" htmlFor="class_group_id" style={{ flex: '0 1 160px' }}>
                <select
                  id="class_group_id"
                  required
                  value={classGroupId}
                  onChange={(event) => setClassGroupId(event.target.value)}
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
            )}
          </FormGrid>

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Kreiranje...' : 'Kreiraj korisnika'}
          </Button>
        </FormCard>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-[18px] font-semibold text-ink font-serif">Osoblje</h2>

        {staff.error && (
          <div className="mb-3">
            <Notice variant="danger">{staff.error}</Notice>
          </div>
        )}

        {!staff.error && (
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
                {staff.loading && <EmptyRow colSpan={4}>Učitavanje...</EmptyRow>}
                {!staff.loading &&
                  staff.users.map((user) => (
                    <Fragment key={user.id}>
                      <Tr>
                        <Td>
                          <div className="font-semibold text-ink">{user.name}</div>
                          <div className="text-[12.5px] text-ink-muted font-mono">{user.email}</div>
                        </Td>
                        <Td>
                          <RoleBadge role={user.role} />
                        </Td>
                        <Td>
                          {user.class_group?.name ?? <span className="text-ink-faint">—</span>}
                        </Td>
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
                {!staff.loading && staff.users.length === 0 && (
                  <EmptyRow colSpan={4}>Nema zaposlenih.</EmptyRow>
                )}
              </Tbody>
            </Table>
            {staff.meta && staff.meta.last_page > 1 && (
              <CardFoot>
                <Pager
                  meta={staff.meta}
                  onPrev={() => setStaff((current) => ({ ...current, page: current.page - 1 }))}
                  onNext={() => setStaff((current) => ({ ...current, page: current.page + 1 }))}
                />
              </CardFoot>
            )}
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-[18px] font-semibold text-ink font-serif">Učenici</h2>

        {students.error && (
          <div className="mb-3">
            <Notice variant="danger">{students.error}</Notice>
          </div>
        )}

        {!students.error && (
          <Card>
            <Table>
              <thead>
                <tr>
                  <Th>Ime</Th>
                  <Th>Odeljenje</Th>
                  <Th>Roditelj</Th>
                </tr>
              </thead>
              <Tbody>
                {students.loading && <EmptyRow colSpan={3}>Učitavanje...</EmptyRow>}
                {!students.loading &&
                  students.users.map((student) => (
                    <Tr key={student.id}>
                      <Td>
                        <div className="font-semibold text-ink">{student.name}</div>
                        <div className="text-[12.5px] text-ink-muted font-mono">
                          {student.email}
                        </div>
                      </Td>
                      <Td>
                        {student.class_group?.name ?? <span className="text-ink-faint">—</span>}
                      </Td>
                      <Td>
                        {addParentUserId === student.id ? (
                          <AddParentToStudentForm
                            studentId={student.id}
                            onCancel={() => setAddParentUserId(null)}
                            onSuccess={(message) => handleParentInviteSuccess(student.id, message)}
                          />
                        ) : student.parents.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {student.parents.map((parent) => (
                              <span key={parent.id}>{parent.name}</span>
                            ))}
                          </div>
                        ) : parentInviteConfirmation?.userId === student.id ? (
                          <span className="text-[12.5px] font-semibold text-success">
                            {parentInviteConfirmation.message}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openAddParent(student.id)}
                            className="text-[12.5px] font-semibold text-accent hover:underline"
                          >
                            + Dodaj roditelja
                          </button>
                        )}
                      </Td>
                    </Tr>
                  ))}
                {!students.loading && students.users.length === 0 && (
                  <EmptyRow colSpan={3}>Nema učenika.</EmptyRow>
                )}
              </Tbody>
            </Table>
            {students.meta && students.meta.last_page > 1 && (
              <CardFoot>
                <Pager
                  meta={students.meta}
                  onPrev={() => setStudents((current) => ({ ...current, page: current.page - 1 }))}
                  onNext={() => setStudents((current) => ({ ...current, page: current.page + 1 }))}
                />
              </CardFoot>
            )}
          </Card>
        )}
      </section>
    </div>
  )
}
