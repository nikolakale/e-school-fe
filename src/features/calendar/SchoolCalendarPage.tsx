import { PageHeader } from '@/shared/ui/PageHeader'

import { HolidaysSection } from './HolidaysSection'
import { SchoolYearsSection } from './SchoolYearsSection'
import { SemestersSection } from './SemestersSection'

/**
 * Školski kalendar: školske godine, polugodišta and praznici stacked
 * vertically, each an independent section. Viewing is open to every
 * authenticated user; the create forms only render for Direktor (checked
 * inside each section, not at the route level).
 */
export function SchoolCalendarPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Nastava" title="Školski kalendar" />
      <div className="space-y-10">
        <SchoolYearsSection />
        <SemestersSection />
        <HolidaysSection />
      </div>
    </div>
  )
}
