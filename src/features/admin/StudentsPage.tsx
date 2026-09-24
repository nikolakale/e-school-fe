import { type FormEvent, useEffect, useState } from 'react'

import { apiFetch, ApiError } from '@/shared/api/client'
import type { ClassGroup, User } from '@/shared/auth/types'
import { Button } from '@/shared/ui/Button'
import { Card, CardFoot } from '@/shared/ui/Card'
import { Field, fieldControlClass, FormCard, FormGrid } from '@/shared/ui/Form'
import { IconPlus } from '@/shared/ui/icons'
import { FormErrors, Notice } from '@/shared/ui/Notice'
import { Pager, type PaginationMeta } from '@/shared/ui/Pager'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyRow, Table, Tbody, Td, Th, Tr } from '@/shared/ui/Table'

import { AddParentToStudentForm } from './AddParentToStudentForm'

interface PaginatedUsers {
  data: User[]
  meta: PaginationMeta
}

export function StudentsPage() {
  const [students, setStudents] = useState<User[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [classGroups, setClassGroups] = useState<ClassGroup[]>([])

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [classGroupId, setClassGroupId] = useState('')
  const [formError, setFormError] = useState<ApiError | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [addParentUserId, setAddParentUserId] = useState<number | null>(null)
  const [parentInviteConfirmation, setParentInviteConfirmation] = useState<{
    userId: number
    message: string
  } | null>(null)

  useEffect(() => {
    void loadStudents(page)
  }, [page])

  useEffect(() => {
    apiFetch<{ data: ClassGroup[] }>('/api/v1/class-groups')
      .then((result) => setClassGroups(result.data))
      .catch(() => {
        // The create form's class-group select just stays empty; a real
        // failure surfaces again (and is shown) when the form is submitted.
      })
  }, [])

  async function loadStudents(targetPage: number) {
    setLoading(true)
    setListError(null)
    try {
      const result = await apiFetch<PaginatedUsers>(`/api/v1/users?role=ucenik&page=${targetPage}`)
      setStudents(result.data)
      setMeta(result.meta)
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Greška pri učitavanju učenika.')
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
      await apiFetch<{ data: User }>('/api/v1/users', {
        method: 'POST',
        body: { name, email, role: 'ucenik', class_group_id: Number(classGroupId) },
      })
      setSuccessMessage('Nalog je kreiran - mejl sa linkom za postavljanje lozinke je poslat.')
      setName('')
      setEmail('')
      setClassGroupId('')
      setShowForm(false)
      setPage(1)
      await loadStudents(1)
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

  function openAddParent(studentId: number) {
    setAddParentUserId(studentId)
    setParentInviteConfirmation(null)
  }

  function handleParentInviteSuccess(studentId: number, message: string) {
    setParentInviteConfirmation({ userId: studentId, message })
    setAddParentUserId(null)
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Administracija"
        title="Učenici"
        subtitle={meta ? `${meta.total} učenika` : undefined}
        action={
          !showForm && (
            <Button onClick={() => setShowForm(true)}>
              <IconPlus className="h-3.5 w-3.5" />
              Dodaj učenika
            </Button>
          )
        }
      />

      {showForm && (
        <FormCard title="Novi učenik" onCancel={() => setShowForm(false)} onSubmit={handleCreate}>
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
          </FormGrid>

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Kreiranje...' : 'Kreiraj učenika'}
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
                <Th>Odeljenje</Th>
                <Th>Roditelj</Th>
              </tr>
            </thead>
            <Tbody>
              {loading && <EmptyRow colSpan={3}>Učitavanje...</EmptyRow>}
              {!loading &&
                students.map((student) => (
                  <Tr key={student.id}>
                    <Td>
                      <div className="font-semibold text-ink">{student.name}</div>
                      <div className="text-[12.5px] text-ink-muted font-mono">{student.email}</div>
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
              {!loading && students.length === 0 && <EmptyRow colSpan={3}>Nema učenika.</EmptyRow>}
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
