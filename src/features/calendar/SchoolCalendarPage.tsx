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
    <div className="mx-auto max-w-4xl space-y-10 p-6">
      <h1 className="text-xl font-semibold">Školski kalendar</h1>
      <SchoolYearsSection />
      <SemestersSection />
      <HolidaysSection />
    </div>
  )
}
