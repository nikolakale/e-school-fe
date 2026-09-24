import type { GradeSummary } from './types'

const GRADES = ['1', '2', '3', '4', '5']

/** "Raspodela ocena" - a magnitude comparison of one measure (count), so a single accent hue, not categorical color. */
export function GradeDistributionBars({ summary }: { summary: GradeSummary }) {
  const max = Math.max(1, ...GRADES.map((grade) => summary.distribution[grade] ?? 0))

  return (
    <div className="flex items-end gap-3" style={{ height: 96 }}>
      {GRADES.map((grade) => {
        const count = summary.distribution[grade] ?? 0
        const height = count === 0 ? 2 : Math.max(6, (count / max) * 72)
        return (
          <div key={grade} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[11px] font-semibold text-ink-muted">{count}</span>
            <div
              className="w-full rounded-t-sm bg-accent"
              style={{ height, opacity: 0.35 + 0.65 * (Number(grade) / 5) }}
            />
            <span className="text-[11px] font-semibold text-ink-faint">{grade}</span>
          </div>
        )
      })}
    </div>
  )
}
