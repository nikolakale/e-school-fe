import type { ScheduledTestType } from '@/features/calendar/types'

export interface GradeSummary {
  average: number | null
  /** Keys "1".."5" - a PHP assoc array with int keys 1-5 serializes as a JSON object, not a tuple. */
  distribution: Record<string, number>
  graded_count: number
  student_count: number
}

export interface TrendPoint {
  scheduled_test_id: number
  subject: { id: number; name: string }
  type: ScheduledTestType
  date: string
  average: number | null
  count: number
}

export interface ClassSubjectAnalytics {
  class_group: { id: number; name: string }
  subject: { id: number; name: string }
  summary: GradeSummary
  trend: TrendPoint[]
}

export interface ClassComparisonEntry extends GradeSummary {
  class_group: { id: number; name: string }
}

export interface QuestionMiss {
  question: { id: number; text: string }
  lesson: { name: string }
  answered_count: number
  miss_rate: number
}

export interface ClassOverviewSubject extends GradeSummary {
  subject: { id: number; name: string }
}

export interface StudentRiskSubjectEntry {
  subject: { id: number; name: string }
  grade: number | null
  is_finalized: boolean
}

export interface StudentRiskEntry {
  student: { id: number; name: string }
  subjects: StudentRiskSubjectEntry[]
  average: number | null
  weak_subject_count: number
}

export interface ClassOverview {
  class_group: { id: number; name: string }
  subjects: ClassOverviewSubject[]
  overall_trend: TrendPoint[]
  student_risk: StudentRiskEntry[]
}

export interface TeacherComparisonEntry {
  teacher: { id: number; name: string }
  test_count: number
  average: number | null
  graded_count: number
}

export interface AttemptRow {
  attempt_id: number
  student: { id: number; name: string }
  submitted_at: string
  percentage: number
  grade: number
  is_retake: boolean
  can_retake: boolean
}

export interface ScheduledTestAttempts {
  scheduled_test: { id: number; type: ScheduledTestType; available_from: string }
  attempts: AttemptRow[]
}
