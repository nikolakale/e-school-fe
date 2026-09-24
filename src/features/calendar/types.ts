export interface SchoolYear {
  id: number
  name: string
  starts_on: string
  ends_on: string
}

export interface Semester {
  id: number
  school_year_id: number
  number: 1 | 2
  starts_on: string
  ends_on: string
  trimester_1_ends_on: string | null
  trimester_2_ends_on: string | null
}

export interface Holiday {
  id: number
  school_year_id: number
  name: string
  starts_on: string
  ends_on: string
}

export type ScheduledTestType = 'mesecni' | 'dvomesecni' | 'polugodisnji' | 'godisnji'

export const SCHEDULED_TEST_TYPE_LABELS: Record<ScheduledTestType, string> = {
  mesecni: 'Mesečni',
  dvomesecni: 'Dvomesečni',
  polugodisnji: 'Polugodišnji',
  godisnji: 'Godišnji',
}

export interface ScheduledTest {
  id: number
  subject: { id: number; name: string }
  class_group: { id: number; name: string }
  semester_id: number
  type: ScheduledTestType
  available_from: string
  available_until: string
  duration_minutes: number | null
  retake_allowed: boolean
  retake_wait_days: number | null
  scheduled_by: { id: number; name: string }
}
