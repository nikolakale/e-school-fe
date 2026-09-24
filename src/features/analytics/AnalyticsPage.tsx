import { useEffect, useState } from 'react'

import { apiFetch, ApiError } from '@/shared/api/client'
import { useAuthStore } from '@/shared/auth/store'
import type { ClassGroup, User } from '@/shared/auth/types'
import { Badge } from '@/shared/ui/Badge'
import { Card } from '@/shared/ui/Card'
import { fieldControlClass } from '@/shared/ui/Form'
import { FormErrors } from '@/shared/ui/Notice'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyRow, Table, Tbody, Td, Th, Tr } from '@/shared/ui/Table'

import type { SchoolYear, Semester } from '../calendar/types'
import { GradeDistributionBars } from './GradeDistributionBars'
import { TrendChart } from './TrendChart'
import type {
  ClassComparisonEntry,
  ClassOverview,
  ClassSubjectAnalytics,
  QuestionMiss,
  TeacherComparisonEntry,
} from './types'

interface ClassGroupWithHomeroom extends ClassGroup {
  homeroom_teacher: { id: number; name: string } | null
}

function semesterLabel(semester: Semester, schoolYears: SchoolYear[]): string {
  const yearName = schoolYears.find((year) => year.id === semester.school_year_id)?.name
  const semesterName = semester.number === 1 ? 'I polugodište' : 'II polugodište'
  return yearName ? `${yearName} - ${semesterName}` : semesterName
}

/**
 * Analitika.md's role-scoped views: nastavnik gets their own predmet+odeljenje,
 * razredni starešina gets their one odeljenje across every predmet, direktor/
 * stručni saradnik get any odeljenje/predmet school-wide - identical scope
 * between those last two except "poređenje po nastavniku", Direktor-only.
 */
export function AnalyticsPage() {
  const user = useAuthStore((state) => state.user)

  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [semesterId, setSemesterId] = useState('')

  useEffect(() => {
    async function loadCalendar() {
      try {
        const [yearsResult, semestersResult] = await Promise.all([
          apiFetch<{ data: SchoolYear[] }>('/api/v1/school-years'),
          apiFetch<{ data: Semester[] }>('/api/v1/semesters'),
        ])
        setSchoolYears(yearsResult.data)
        setSemesters(semestersResult.data)
        const today = new Date().toISOString().slice(0, 10)
        const current = semestersResult.data.find(
          (semester) => semester.starts_on <= today && today <= semester.ends_on,
        )
        setSemesterId(String(current?.id ?? semestersResult.data[0]?.id ?? ''))
      } catch {
        // The picker just stays empty; sections below show their own errors.
      }
    }
    void loadCalendar()
  }, [])

  if (!user) return null

  const semesterPicker = semesters.length > 0 && (
    <select
      value={semesterId}
      onChange={(event) => setSemesterId(event.target.value)}
      className={fieldControlClass}
    >
      {semesters.map((semester) => (
        <option key={semester.id} value={semester.id}>
          {semesterLabel(semester, schoolYears)}
        </option>
      ))}
    </select>
  )

  if (!semesterId) {
    return (
      <div className="max-w-4xl">
        <PageHeader eyebrow="Analitika" title="Analitika" />
        <p className="text-[13.5px] text-ink-muted">Nema definisanog polugodišta.</p>
      </div>
    )
  }

  if (user.role.slug === 'nastavnik') {
    return (
      <NastavnikAnalytics user={user} semesterId={semesterId} semesterPicker={semesterPicker} />
    )
  }

  if (user.role.slug === 'razredni_staresina') {
    return <RazredniAnalytics user={user} semesterId={semesterId} semesterPicker={semesterPicker} />
  }

  if (user.role.slug === 'direktor' || user.role.slug === 'strucni_saradnik') {
    return (
      <StaffWideAnalytics
        semesterId={semesterId}
        semesterPicker={semesterPicker}
        canViewTeacherComparison={user.role.slug === 'direktor'}
      />
    )
  }

  return null
}

function NastavnikAnalytics({
  user,
  semesterId,
  semesterPicker,
}: {
  user: User
  semesterId: string
  semesterPicker: React.ReactNode
}) {
  const subjects = user.taught_subjects
  const classes = user.taught_classes
  const [subjectId, setSubjectId] = useState(String(subjects[0]?.id ?? ''))
  const [classGroupId, setClassGroupId] = useState(String(classes[0]?.id ?? ''))

  if (subjects.length === 0 || classes.length === 0) {
    return (
      <div className="max-w-4xl">
        <PageHeader eyebrow="Analitika" title="Moja analitika" action={semesterPicker} />
        <p className="text-[13.5px] text-ink-muted">Nemate dodeljen predmet/odeljenje.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Analitika" title="Moja analitika" action={semesterPicker} />

      <div className="mb-5 flex flex-wrap gap-3">
        <select
          value={subjectId}
          onChange={(event) => setSubjectId(event.target.value)}
          className={fieldControlClass}
        >
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
        <select
          value={classGroupId}
          onChange={(event) => setClassGroupId(event.target.value)}
          className={fieldControlClass}
        >
          {classes.map((classGroup) => (
            <option key={classGroup.id} value={classGroup.id}>
              {classGroup.name}
            </option>
          ))}
        </select>
      </div>

      <ClassSubjectSection
        classGroupId={classGroupId}
        subjectId={subjectId}
        semesterId={semesterId}
      />
      <ClassComparisonSection
        subjectId={subjectId}
        semesterId={semesterId}
        title="Poređenje odeljenja koja predajem"
      />
      <QuestionAnalysisSection subjectId={subjectId} semesterId={semesterId} />
    </div>
  )
}

function RazredniAnalytics({
  user,
  semesterId,
  semesterPicker,
}: {
  user: User
  semesterId: string
  semesterPicker: React.ReactNode
}) {
  const [classGroupId, setClassGroupId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    async function findOwnClass() {
      try {
        const result = await apiFetch<{ data: ClassGroupWithHomeroom[] }>('/api/v1/class-groups')
        const own = result.data.find((classGroup) => classGroup.homeroom_teacher?.id === user.id)
        setClassGroupId(own ? String(own.id) : '')
      } catch {
        setLoadError(true)
      }
    }
    void findOwnClass()
  }, [user.id])

  if (loadError || classGroupId === '') {
    return (
      <div className="max-w-4xl">
        <PageHeader eyebrow="Analitika" title="Analitika odeljenja" action={semesterPicker} />
        <p className="text-[13.5px] text-ink-muted">Niste razredni starešina nijednog odeljenja.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Analitika" title="Analitika odeljenja" action={semesterPicker} />
      {classGroupId && <ClassOverviewSection classGroupId={classGroupId} semesterId={semesterId} />}
    </div>
  )
}

function StaffWideAnalytics({
  semesterId,
  semesterPicker,
  canViewTeacherComparison,
}: {
  semesterId: string
  semesterPicker: React.ReactNode
  canViewTeacherComparison: boolean
}) {
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([])
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([])
  const [overviewClassGroupId, setOverviewClassGroupId] = useState('')
  const [comparisonSubjectId, setComparisonSubjectId] = useState('')

  useEffect(() => {
    async function loadOptions() {
      try {
        const [classGroupsResult, subjectsResult] = await Promise.all([
          apiFetch<{ data: ClassGroup[] }>('/api/v1/class-groups'),
          apiFetch<{ data: { id: number; name: string }[] }>('/api/v1/subjects'),
        ])
        setClassGroups(classGroupsResult.data)
        setSubjects(subjectsResult.data)
        setOverviewClassGroupId((current) => current || String(classGroupsResult.data[0]?.id ?? ''))
        setComparisonSubjectId((current) => current || String(subjectsResult.data[0]?.id ?? ''))
      } catch {
        // The pickers just stay empty.
      }
    }
    void loadOptions()
  }, [])

  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Analitika" title="Školska analitika" action={semesterPicker} />

      <section className="mb-8">
        <h2 className="mb-3 text-[15px] font-semibold text-ink font-serif">Pregled odeljenja</h2>
        <select
          value={overviewClassGroupId}
          onChange={(event) => setOverviewClassGroupId(event.target.value)}
          className={`${fieldControlClass} mb-3`}
        >
          {classGroups.map((classGroup) => (
            <option key={classGroup.id} value={classGroup.id}>
              {classGroup.name}
            </option>
          ))}
        </select>
        {overviewClassGroupId && (
          <ClassOverviewSection classGroupId={overviewClassGroupId} semesterId={semesterId} />
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-[15px] font-semibold text-ink font-serif">
          Poređenje svih odeljenja po predmetu
        </h2>
        <select
          value={comparisonSubjectId}
          onChange={(event) => setComparisonSubjectId(event.target.value)}
          className={`${fieldControlClass} mb-3`}
        >
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
        {comparisonSubjectId && (
          <ClassComparisonSection
            subjectId={comparisonSubjectId}
            semesterId={semesterId}
            title=""
            hideHeading
          />
        )}
      </section>

      {canViewTeacherComparison && (
        <section>
          <h2 className="mb-3 text-[15px] font-semibold text-ink font-serif">
            Poređenje po nastavniku
          </h2>
          <TeacherComparisonSection semesterId={semesterId} />
        </section>
      )}
    </div>
  )
}

function ClassSubjectSection({
  classGroupId,
  subjectId,
  semesterId,
}: {
  classGroupId: string
  subjectId: string
  semesterId: string
}) {
  const [data, setData] = useState<ClassSubjectAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await apiFetch<{ data: ClassSubjectAnalytics }>(
          `/api/v1/analytics/class-subject?class_group_id=${classGroupId}&subject_id=${subjectId}&semester_id=${semesterId}`,
        )
        setData(result.data)
      } catch (err) {
        setError(err instanceof ApiError ? err : new ApiError(500, 'Greška pri učitavanju.'))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [classGroupId, subjectId, semesterId])

  if (loading) return <p className="mb-6 text-ink-muted">Učitavanje...</p>
  if (error)
    return (
      <div className="mb-6">
        <FormErrors error={error} />
      </div>
    )
  if (!data) return null

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-[15px] font-semibold text-ink font-serif">
        Prosek i raspodela - {data.class_group.name}
      </h2>
      <Card className="mb-5 flex flex-wrap items-center gap-8 p-4">
        <div>
          <div className="text-[11px] font-semibold text-ink-muted">Prosek</div>
          <div className="text-2xl font-semibold text-ink font-serif">
            {data.summary.average ?? '—'}
          </div>
          <div className="text-[11px] text-ink-faint">
            {data.summary.graded_count}/{data.summary.student_count} ocenjeno
          </div>
        </div>
        <GradeDistributionBars summary={data.summary} />
      </Card>

      <h3 className="mb-2 text-[13px] font-semibold text-ink-muted">Trend kroz vreme</h3>
      <Card className="p-4">
        <TrendChart points={data.trend} />
      </Card>
    </section>
  )
}

function ClassComparisonSection({
  subjectId,
  semesterId,
  title,
  hideHeading,
}: {
  subjectId: string
  semesterId: string
  title: string
  hideHeading?: boolean
}) {
  const [entries, setEntries] = useState<ClassComparisonEntry[] | null>(null)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    async function load() {
      setError(null)
      try {
        const result = await apiFetch<{ data: { classes: ClassComparisonEntry[] } }>(
          `/api/v1/analytics/class-comparison?subject_id=${subjectId}&semester_id=${semesterId}`,
        )
        setEntries(result.data.classes)
      } catch (err) {
        setError(err instanceof ApiError ? err : new ApiError(500, 'Greška pri učitavanju.'))
      }
    }
    void load()
  }, [subjectId, semesterId])

  if (error) return <FormErrors error={error} />

  return (
    <section className={hideHeading ? '' : 'mb-8'}>
      {!hideHeading && (
        <h2 className="mb-3 text-[15px] font-semibold text-ink font-serif">{title}</h2>
      )}
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Odeljenje</Th>
              <Th>Prosek</Th>
              <Th>Ocenjeno</Th>
            </tr>
          </thead>
          <Tbody>
            {entries === null && <EmptyRow colSpan={3}>Učitavanje...</EmptyRow>}
            {entries?.map((entry) => (
              <Tr key={entry.class_group.id}>
                <Td className="font-semibold text-ink">{entry.class_group.name}</Td>
                <Td className="font-mono">{entry.average ?? '—'}</Td>
                <Td>
                  {entry.graded_count}/{entry.student_count}
                </Td>
              </Tr>
            ))}
            {entries?.length === 0 && <EmptyRow colSpan={3}>Nema podataka.</EmptyRow>}
          </Tbody>
        </Table>
      </Card>
    </section>
  )
}

function QuestionAnalysisSection({
  subjectId,
  semesterId,
}: {
  subjectId: string
  semesterId: string
}) {
  const [questions, setQuestions] = useState<QuestionMiss[] | null>(null)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    async function load() {
      setError(null)
      try {
        const result = await apiFetch<{ data: { questions: QuestionMiss[] } }>(
          `/api/v1/analytics/subject-questions?subject_id=${subjectId}&semester_id=${semesterId}`,
        )
        setQuestions(result.data.questions)
      } catch (err) {
        setError(err instanceof ApiError ? err : new ApiError(500, 'Greška pri učitavanju.'))
      }
    }
    void load()
  }, [subjectId, semesterId])

  if (error) return <FormErrors error={error} />

  return (
    <section>
      <h2 className="mb-3 text-[15px] font-semibold text-ink font-serif">
        Pitanja koja se najčešće greše
      </h2>
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Pitanje</Th>
              <Th>Lekcija</Th>
              <Th>% grešaka</Th>
              <Th>Odgovora</Th>
            </tr>
          </thead>
          <Tbody>
            {questions === null && <EmptyRow colSpan={4}>Učitavanje...</EmptyRow>}
            {questions?.map((row) => (
              <Tr key={row.question.id}>
                <Td className="max-w-xs text-ink">
                  <span className="block truncate" title={row.question.text}>
                    {row.question.text}
                  </span>
                </Td>
                <Td>{row.lesson.name}</Td>
                <Td className="font-mono">{row.miss_rate}%</Td>
                <Td>{row.answered_count}</Td>
              </Tr>
            ))}
            {questions?.length === 0 && <EmptyRow colSpan={4}>Nema dovoljno podataka.</EmptyRow>}
          </Tbody>
        </Table>
      </Card>
    </section>
  )
}

function ClassOverviewSection({
  classGroupId,
  semesterId,
}: {
  classGroupId: string
  semesterId: string
}) {
  const [overview, setOverview] = useState<ClassOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await apiFetch<{ data: ClassOverview }>(
          `/api/v1/analytics/class-overview?class_group_id=${classGroupId}&semester_id=${semesterId}`,
        )
        setOverview(result.data)
      } catch (err) {
        setError(err instanceof ApiError ? err : new ApiError(500, 'Greška pri učitavanju.'))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [classGroupId, semesterId])

  if (loading) return <p className="text-ink-muted">Učitavanje...</p>
  if (error) return <FormErrors error={error} />
  if (!overview) return null

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Predmet</Th>
              <Th>Prosek</Th>
              <Th>Ocenjeno</Th>
            </tr>
          </thead>
          <Tbody>
            {overview.subjects.map((row) => (
              <Tr key={row.subject.id}>
                <Td className="font-semibold text-ink">{row.subject.name}</Td>
                <Td className="font-mono">{row.average ?? '—'}</Td>
                <Td>
                  {row.graded_count}/{row.student_count}
                </Td>
              </Tr>
            ))}
            {overview.subjects.length === 0 && <EmptyRow colSpan={3}>Nema predmeta.</EmptyRow>}
          </Tbody>
        </Table>
      </Card>

      <div>
        <h3 className="mb-2 text-[13px] font-semibold text-ink-muted">
          Ukupan prosek odeljenja kroz vreme
        </h3>
        <Card className="p-4">
          <TrendChart points={overview.overall_trend} />
        </Card>
      </div>

      <div>
        <h3 className="mb-2 text-[13px] font-semibold text-ink-muted">
          Učenici kojima je potrebna podrška
        </h3>
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>Učenik</Th>
                {overview.subjects.map((row) => (
                  <Th key={row.subject.id}>{row.subject.name}</Th>
                ))}
                <Th>Prosek</Th>
                <Th>Slabih predmeta</Th>
              </tr>
            </thead>
            <Tbody>
              {overview.student_risk.map((row) => (
                <Tr key={row.student.id}>
                  <Td className="font-semibold text-ink">{row.student.name}</Td>
                  {overview.subjects.map((subjectRow) => {
                    const entry = row.subjects.find((s) => s.subject.id === subjectRow.subject.id)
                    return (
                      <Td key={subjectRow.subject.id} className="font-mono">
                        {entry?.grade ?? '—'}
                      </Td>
                    )
                  })}
                  <Td className="font-mono">{row.average ?? '—'}</Td>
                  <Td>
                    {row.weak_subject_count > 0 ? (
                      <Badge fg="var(--color-danger)" bg="var(--color-danger-soft)">
                        {row.weak_subject_count}
                      </Badge>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </Td>
                </Tr>
              ))}
              {overview.student_risk.length === 0 && (
                <EmptyRow colSpan={overview.subjects.length + 3}>Nema učenika.</EmptyRow>
              )}
            </Tbody>
          </Table>
        </Card>
      </div>
    </div>
  )
}

function TeacherComparisonSection({ semesterId }: { semesterId: string }) {
  const [entries, setEntries] = useState<TeacherComparisonEntry[] | null>(null)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    async function load() {
      setError(null)
      try {
        const result = await apiFetch<{ data: { teachers: TeacherComparisonEntry[] } }>(
          `/api/v1/analytics/teacher-comparison?semester_id=${semesterId}`,
        )
        setEntries(result.data.teachers)
      } catch (err) {
        setError(err instanceof ApiError ? err : new ApiError(500, 'Greška pri učitavanju.'))
      }
    }
    void load()
  }, [semesterId])

  if (error) return <FormErrors error={error} />

  return (
    <Card>
      <Table>
        <thead>
          <tr>
            <Th>Nastavnik</Th>
            <Th>Prosek učenika</Th>
            <Th>Broj testova</Th>
          </tr>
        </thead>
        <Tbody>
          {entries === null && <EmptyRow colSpan={3}>Učitavanje...</EmptyRow>}
          {entries?.map((entry) => (
            <Tr key={entry.teacher.id}>
              <Td className="font-semibold text-ink">{entry.teacher.name}</Td>
              <Td className="font-mono">{entry.average ?? '—'}</Td>
              <Td>{entry.test_count}</Td>
            </Tr>
          ))}
          {entries?.length === 0 && <EmptyRow colSpan={3}>Nema podataka.</EmptyRow>}
        </Tbody>
      </Table>
    </Card>
  )
}
