import { type FormEvent, useEffect, useState } from 'react'

import { apiFetch, ApiError } from '@/shared/api/client'
import type { ClassGroup, RoleSlug, User } from '@/shared/auth/types'

interface PaginationMeta {
  current_page: number
  last_page: number
  total: number
}

interface PaginatedUsers {
  data: User[]
  meta: PaginationMeta
}

type CreatableRole = Extract<RoleSlug, 'ucenik' | 'nastavnik'>

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  const [classGroups, setClassGroups] = useState<ClassGroup[]>([])

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<CreatableRole>('ucenik')
  const [classGroupId, setClassGroupId] = useState('')
  const [formError, setFormError] = useState<ApiError | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void loadUsers(page)
  }, [page])

  useEffect(() => {
    apiFetch<{ data: ClassGroup[] }>('/api/v1/class-groups')
      .then((result) => setClassGroups(result.data))
      .catch(() => {
        // The create form's class-group select just stays empty; a real
        // failure surfaces again (and is shown) when the form is submitted.
      })
  }, [])

  async function loadUsers(targetPage: number) {
    setLoading(true)
    setListError(null)
    try {
      const result = await apiFetch<PaginatedUsers>(`/api/v1/users?page=${targetPage}`)
      setUsers(result.data)
      setMeta(result.meta)
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Greška pri učitavanju korisnika.')
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
      setRole('ucenik')
      setClassGroupId('')
      setShowForm(false)
      setPage(1)
      await loadUsers(1)
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
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Korisnici</h1>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Dodaj korisnika
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Novi korisnik</h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Otkaži
            </button>
          </div>

          {successMessage && (
            <p className="rounded bg-green-50 p-2 text-sm text-green-700">{successMessage}</p>
          )}
          {formError && (
            <div className="rounded bg-red-50 p-2 text-sm text-red-700">
              <p>{formError.message}</p>
              {formError.errors &&
                Object.values(formError.errors)
                  .flat()
                  .map((message) => <p key={message}>{message}</p>)}
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Ime i prezime
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 rounded border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 rounded border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Uloga
              </label>
              <select
                id="role"
                value={role}
                onChange={(event) => setRole(event.target.value as CreatableRole)}
                className="mt-1 rounded border border-gray-300 px-3 py-2"
              >
                <option value="ucenik">Učenik</option>
                <option value="nastavnik">Nastavnik</option>
              </select>
            </div>

            {role === 'ucenik' && (
              <div>
                <label htmlFor="class_group_id" className="block text-sm font-medium text-gray-700">
                  Odeljenje
                </label>
                <select
                  id="class_group_id"
                  required
                  value={classGroupId}
                  onChange={(event) => setClassGroupId(event.target.value)}
                  className="mt-1 rounded border border-gray-300 px-3 py-2"
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
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Kreiranje...' : 'Kreiraj korisnika'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        <h2 className="font-medium">Spisak korisnika</h2>

        {listError && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{listError}</p>}
        {loading && <p className="text-sm text-gray-500">Učitavanje...</p>}

        {!loading && !listError && (
          <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Ime
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Uloga
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Odeljenje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{user.name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.role.name}</td>
                    <td className="px-4 py-3">{user.class_group?.name ?? '-'}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      Nema korisnika.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {meta && (
          <div className="flex items-center gap-3 text-sm">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
            >
              Prethodna
            </button>
            <span>
              Strana {meta.current_page} od {meta.last_page} (ukupno {meta.total})
            </span>
            <button
              type="button"
              disabled={page >= meta.last_page}
              onClick={() => setPage((current) => current + 1)}
              className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
            >
              Sledeća
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
