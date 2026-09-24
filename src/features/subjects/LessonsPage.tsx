import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { apiFetch, ApiError } from '@/shared/api/client'
import { Card } from '@/shared/ui/Card'
import { Notice } from '@/shared/ui/Notice'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyRow, Table, Tbody, Td, Th, Tr } from '@/shared/ui/Table'

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

  useEffect(() => {
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

    void loadLessons()
  }, [subjectId])

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Nastava"
        title="Lekcije"
        action={
          <Link to="/subjects" className="text-[13.5px] font-semibold text-accent hover:underline">
            Nazad na predmete
          </Link>
        }
      />

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
                <Th>Br.</Th>
                <Th>Naziv</Th>
                <Th>Broj pitanja</Th>
              </tr>
            </thead>
            <Tbody>
              {loading && <EmptyRow colSpan={3}>Učitavanje...</EmptyRow>}
              {!loading &&
                lessons.map((lesson) => (
                  <Tr key={lesson.id}>
                    <Td className="font-mono text-ink-muted">{lesson.number}</Td>
                    <Td className="font-semibold text-ink">{lesson.name}</Td>
                    <Td>{lesson.question_count}</Td>
                  </Tr>
                ))}
              {!loading && lessons.length === 0 && <EmptyRow colSpan={3}>Nema lekcija.</EmptyRow>}
            </Tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}
