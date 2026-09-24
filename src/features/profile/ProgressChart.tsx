import { useState } from 'react'

import { SCHEDULED_TEST_TYPE_LABELS, type ScheduledTestType } from '@/features/calendar/types'

import type { ProfileAttempt } from './types'

const WIDTH = 640
const HEIGHT = 200
const PADDING = { top: 16, right: 16, bottom: 12, left: 24 }

/**
 * Categorical color by tip testa - only 3 hues (validated all-pairs colorblind
 * safe as a triplet, see dataviz skill's reference palette). Godišnji is rare
 * enough (~1/year) that a 4th hue isn't worth the all-pairs safety it would cost;
 * it's told apart by a diamond marker instead (color follows identity, but
 * identity is never color-alone here either way).
 */
const TYPE_COLOR: Partial<Record<ScheduledTestType, string>> = {
  mesecni: 'var(--chart-mesecni)',
  dvomesecni: 'var(--chart-dvomesecni)',
  polugodisnji: 'var(--chart-polugodisnji)',
}

const LEGEND_TYPES: ScheduledTestType[] = ['mesecni', 'dvomesecni', 'polugodisnji']

function gradeY(grade: number): number {
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom
  return PADDING.top + plotHeight * (1 - (grade - 1) / 4)
}

/** Grafik napretka: svaki pokušaj je jedna tačka na vremenskoj liniji, bez agregacije. */
export function ProgressChart({ attempts }: { attempts: ProfileAttempt[] }) {
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  if (attempts.length === 0) {
    return <p className="text-[13.5px] text-ink-muted">Nema još položenih testova.</p>
  }

  const times = attempts.map((attempt) => new Date(attempt.submitted_at).getTime())
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  const plotWidth = WIDTH - PADDING.left - PADDING.right

  function timeX(time: number): number {
    if (maxTime === minTime) return PADDING.left + plotWidth / 2
    return PADDING.left + plotWidth * ((time - minTime) / (maxTime - minTime))
  }

  const hovered = attempts.find((attempt) => attempt.id === hoveredId) ?? null

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Grafik napretka kroz vreme"
      >
        {[1, 2, 3, 4, 5].map((grade) => (
          <g key={grade}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={gradeY(grade)}
              y2={gradeY(grade)}
              stroke="var(--color-border)"
              strokeWidth={1}
            />
            <text
              x={PADDING.left - 8}
              y={gradeY(grade) + 3.5}
              textAnchor="end"
              fontSize={10}
              fill="var(--color-ink-faint)"
            >
              {grade}
            </text>
          </g>
        ))}

        {attempts.map((attempt) => {
          const cx = timeX(new Date(attempt.submitted_at).getTime())
          const cy = gradeY(attempt.grade)
          const label = `${attempt.subject.name} - ${SCHEDULED_TEST_TYPE_LABELS[attempt.type]} - ocena ${attempt.grade}`

          if (attempt.type === 'godisnji') {
            const size = 6.5
            return (
              <rect
                key={attempt.id}
                x={cx - size / 2}
                y={cy - size / 2}
                width={size}
                height={size}
                transform={`rotate(45 ${cx} ${cy})`}
                fill="var(--color-ink-muted)"
                stroke="var(--color-surface)"
                strokeWidth={1.5}
                onMouseEnter={() => setHoveredId(attempt.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <title>{label}</title>
              </rect>
            )
          }

          return (
            <circle
              key={attempt.id}
              cx={cx}
              cy={cy}
              r={5}
              fill={TYPE_COLOR[attempt.type]}
              stroke="var(--color-surface)"
              strokeWidth={1.5}
              onMouseEnter={() => setHoveredId(attempt.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <title>{label}</title>
            </circle>
          )
        })}
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-ink-muted">
        {LEGEND_TYPES.map((type) => (
          <span key={type} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: TYPE_COLOR[type] }}
            />
            {SCHEDULED_TEST_TYPE_LABELS[type]}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rotate-45 bg-ink-muted" />
          {SCHEDULED_TEST_TYPE_LABELS.godisnji}
        </span>
      </div>

      <p className="mt-2 h-4 text-[12px] text-ink-muted">
        {hovered &&
          `${hovered.subject.name} - ${SCHEDULED_TEST_TYPE_LABELS[hovered.type]} - ${new Date(hovered.submitted_at).toLocaleDateString('sr-RS')} - ocena ${hovered.grade}`}
      </p>
    </div>
  )
}
