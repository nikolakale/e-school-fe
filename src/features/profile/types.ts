import type { ScheduledTestType } from '@/features/calendar/types'

export interface CurrentGrade {
  subject: { id: number; name: string }
  /** Null when nothing's been graded for this subject yet this semester. */
  grade: number | null
  is_finalized: boolean
}

export interface ProfileAttempt {
  id: number
  subject: { id: number; name: string }
  type: ScheduledTestType
  submitted_at: string
  percentage: number
  grade: number
  is_retake: boolean
}

export interface UpcomingTest {
  id: number
  subject: { id: number; name: string }
  type: ScheduledTestType
  available_from: string
  available_until: string
}

export interface StudentProfile {
  student: {
    id: number
    name: string
    class_group: { id: number; name: string } | null
  }
  current_grades: CurrentGrade[]
  attempts: ProfileAttempt[]
  upcoming_tests: UpcomingTest[]
}
