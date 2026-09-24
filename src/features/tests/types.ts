import type { ScheduledTestType } from '@/features/calendar/types'

export interface AttemptQuestionOption {
  id: number
  text: string
}

export interface AttemptQuestion {
  id: number
  text: string
  options: AttemptQuestionOption[]
}

export interface AttemptAnswer {
  question_id: number
  question_option_id: number
}

export interface ExamAttempt {
  id: number
  scheduled_test: {
    id: number
    subject: { id: number; name: string }
    type: ScheduledTestType
    duration_minutes: number
  }
  started_at: string
  submitted_at: string | null
  /** The later of "duration ran out" and "test's availability window closed" - see BE ExamAttempt::deadline(). */
  deadline: string
  is_submitted: boolean
  questions: AttemptQuestion[]
  answers: AttemptAnswer[]
}
