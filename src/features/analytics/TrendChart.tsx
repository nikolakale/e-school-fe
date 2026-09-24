import { useState } from 'react'

import type { TrendPoint } from './types'

const WIDTH = 640
const HEIGHT = 180
const PADDING = { top: 16, right: 16, bottom: 12, left: 24 }

function gradeY(grade: number): number {
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom
  return PADDING.top + plotHeight * (1 - (grade - 1) / 4)
}

/**
 * Single-series line - "da li odeljenje napreduje ili opada": one connected
 * line of class averages over time, no legend needed (one series, the title
 * above it already names it).
 */
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const graded = points.filter((point) => point.average !== null)
  if (graded.length === 0) {
    return <p className="text-[13.5px] text-ink-muted">Nema još podataka za trend.</p>
  }

  const times = graded.map((point) => new Date(point.date).getTime())
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  const plotWidth = WIDTH - PADDING.left - PADDING.right

  function timeX(time: number): number {
    if (maxTime === minTime) return PADDING.left + plotWidth / 2
    return PADDING.left + plotWidth * ((time - minTime) / (maxTime - minTime))
  }

  const coords = graded.map((point) => ({
    x: timeX(new Date(point.date).getTime()),
    y: gradeY(point.average as number),
  }))
  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
  const hovered = hoveredIndex !== null ? graded[hoveredIndex] : null

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Trend proseka kroz vreme"
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

        <path d={linePath} fill="none" stroke="var(--color-accent)" strokeWidth={2} />

        {coords.map((c, i) => (
          <circle
            key={graded[i].scheduled_test_id}
            cx={c.x}
            cy={c.y}
            r={5}
            fill="var(--color-accent)"
            stroke="var(--color-surface)"
            strokeWidth={1.5}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <title>{`${graded[i].subject.name} - ${new Date(graded[i].date).toLocaleDateString('sr-RS')} - prosek ${graded[i].average}`}</title>
          </circle>
        ))}
      </svg>

      <p className="mt-2 h-4 text-[12px] text-ink-muted">
        {hovered &&
          `${hovered.subject.name} - ${new Date(hovered.date).toLocaleDateString('sr-RS')} - prosek ${hovered.average} (${hovered.count} učenika)`}
      </p>
    </div>
  )
}
