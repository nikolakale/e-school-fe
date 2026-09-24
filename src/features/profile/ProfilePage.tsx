import { useEffect, useState } from 'react'

import { SCHEDULED_TEST_TYPE_LABELS } from '@/features/calendar/types'
import { apiFetch, ApiError } from '@/shared/api/client'
import { useAuthStore } from '@/shared/auth/store'
import { Card } from '@/shared/ui/Card'
import { fieldControlClass } from '@/shared/ui/Form'
import { FormErrors } from '@/shared/ui/Notice'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyRow, Table, Tbody, Td, Th, Tr } from '@/shared/ui/Table'

import { ProgressChart } from './ProgressChart'
import type { StudentProfile } from './types'

/**
 * "Sta ucenik (i roditelj, za svoje dete) vidi u profilu" - licni podaci i
 * napredak, bez poredjenja sa prosekom odeljenja. Roditelj sa vise dece bira
 * izmedju njih preko dropdown-a; ucenik uvek gleda sopstveni profil.
 */
export function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const isRoditelj = user?.role.slug === 'roditelj'
  const children = user?.children ?? []

  const defaultStudentId = user ? String(isRoditelj ? (children[0]?.id ?? '') : user.id) : ''
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const studentId = selectedStudentId || defaultStudentId

  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    async function loadProfile() {
      if (!studentId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const result = await apiFetch<{ data: StudentProfile }>(
          `/api/v1/students/${studentId}/profile`,
        )
        setProfile(result.data)
      } catch (err) {
        setError(
          err instanceof ApiError ? err : new ApiError(500, 'Greška pri učitavanju profila.'),
        )
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [studentId])

  if (isRoditelj && children.length === 0) {
    return (
      <div className="max-w-3xl">
        <PageHeader eyebrow="Profil" title="Profil" />
        <p className="text-[13.5px] text-ink-muted">Nema povezane dece na ovom nalogu.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Profil"
        title={profile?.student.name ?? 'Profil'}
        subtitle={profile?.student.class_group?.name}
        action={
          isRoditelj &&
          children.length > 1 && (
            <select
              value={studentId}
              onChange={(event) => setSelectedStudentId(event.target.value)}
              className={fieldControlClass}
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </select>
          )
        }
      />

      {loading && <p className="text-ink-muted">Učitavanje...</p>}
      {error && <FormErrors error={error} />}

      {profile && !loading && (
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="mb-3 text-[15px] font-semibold text-ink font-serif">Trenutne ocene</h2>
            {profile.current_grades.length === 0 ? (
              <p className="text-[13.5px] text-ink-muted">Nema još ocena.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {profile.current_grades.map((entry) => (
                  <Card
                    key={entry.subject.id}
                    className="flex min-w-[140px] flex-col gap-1 px-4 py-3"
                  >
                    <span className="text-[12px] font-semibold text-ink-muted">
                      {entry.subject.name}
                    </span>
                    <span className="text-2xl font-semibold text-ink font-serif">
                      {entry.grade ?? <span className="text-ink-faint">—</span>}
                    </span>
                    <span className="text-[11px] text-ink-faint">
                      {entry.grade === null
                        ? 'Nema podataka'
                        : entry.is_finalized
                          ? 'Zaključena'
                          : 'Predlog'}
                    </span>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-[15px] font-semibold text-ink font-serif">
              Napredak kroz vreme
            </h2>
            <Card className="p-4">
              <ProgressChart attempts={profile.attempts} />
            </Card>
          </section>

          <section>
            <h2 className="mb-3 text-[15px] font-semibold text-ink font-serif">
              Istorija polaganja
            </h2>
            <Card>
              <Table>
                <thead>
                  <tr>
                    <Th>Datum</Th>
                    <Th>Predmet</Th>
                    <Th>Tip</Th>
                    <Th>Rezultat</Th>
                    <Th>Ocena</Th>
                    <Th>Popravni</Th>
                  </tr>
                </thead>
                <Tbody>
                  {[...profile.attempts].reverse().map((attempt) => (
                    <Tr key={attempt.id}>
                      <Td>{new Date(attempt.submitted_at).toLocaleDateString('sr-RS')}</Td>
                      <Td className="font-semibold text-ink">{attempt.subject.name}</Td>
                      <Td>{SCHEDULED_TEST_TYPE_LABELS[attempt.type]}</Td>
                      <Td className="font-mono">{attempt.percentage}%</Td>
                      <Td className="font-mono">{attempt.grade}</Td>
                      <Td>{attempt.is_retake ? 'Da' : 'Ne'}</Td>
                    </Tr>
                  ))}
                  {profile.attempts.length === 0 && (
                    <EmptyRow colSpan={6}>Nema položenih testova.</EmptyRow>
                  )}
                </Tbody>
              </Table>
            </Card>
          </section>

          <section>
            <h2 className="mb-3 text-[15px] font-semibold text-ink font-serif">
              Predstojeći testovi
            </h2>
            <Card>
              <Table>
                <thead>
                  <tr>
                    <Th>Predmet</Th>
                    <Th>Tip</Th>
                    <Th>Dostupan od</Th>
                  </tr>
                </thead>
                <Tbody>
                  {profile.upcoming_tests.map((test) => (
                    <Tr key={test.id}>
                      <Td className="font-semibold text-ink">{test.subject.name}</Td>
                      <Td>{SCHEDULED_TEST_TYPE_LABELS[test.type]}</Td>
                      <Td>{new Date(test.available_from).toLocaleString('sr-RS')}</Td>
                    </Tr>
                  ))}
                  {profile.upcoming_tests.length === 0 && (
                    <EmptyRow colSpan={3}>Nema predstojećih testova.</EmptyRow>
                  )}
                </Tbody>
              </Table>
            </Card>
          </section>
        </div>
      )}
    </div>
  )
}
