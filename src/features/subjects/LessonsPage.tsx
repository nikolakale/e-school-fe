import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { apiFetch, ApiError } from '@/shared/api/client'

interface Lesson {
  id: number
  subject_id: number
  number: number
  name: string
  question_count: number
}

/**
 * Read-only list of a subject's lessons, ordered by number (as returned by
 * the API). No create/edit UI - lesson/question content is seeded from CSV.
 */
export function LessonsPage() {
  const { subjectId } = useParams<{ subjectId: string }>()

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  async function loadLessons() {
    setLoading(true)
    setListError(null)
    try {
      const result = await apiFetch<{ data: Lesson[] }>(`/api/v1/subjects/${subjectId}/lessons`)
      setLessons(result.data)
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Greška pri učitavanju lekcija.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadLessons's setState calls happen after the awaited request, not synchronously
    void loadLessons()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadLessons only closes over subjectId, which is already listed
  }, [subjectId])

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Lekcije</h1>
        <Link to="/subjects" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
          Nazad na predmete
        </Link>
      </div>

      <div className="space-y-3">
        {listError && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{listError}</p>}
        {loading && <p className="text-sm text-gray-500">Učitavanje...</p>}

        {!loading && !listError && (
          <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Br.
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Naziv
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Broj pitanja
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {lessons.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{lesson.number}</td>
                    <td className="px-4 py-3">{lesson.name}</td>
                    <td className="px-4 py-3">{lesson.question_count}</td>
                  </tr>
                ))}
                {lessons.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                      Nema lekcija.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
