import type { SVGProps } from 'react'

/**
 * Inline icon glyphs ported 1:1 from the approved mockup (no icon library
 * dependency). Each is a thin wrapper around an <svg>; pass `className` to
 * size/color it (defaults match the mockup's 15-16px, stroke-width 1.8).
 */
type IconProps = SVGProps<SVGSVGElement>

function iconProps(props: IconProps): IconProps {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: 'h-4 w-4 shrink-0',
    ...props,
  }
}

export function IconSubjects(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M4 6.5 12 3l8 3.5-8 3.5-8-3.5Z" />
      <path d="M7 10v5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-5" />
    </svg>
  )
}

export function IconCalendar(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 3v3M16 3v3" />
    </svg>
  )
}

export function IconScheduledTests(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M9 11.5 11 13.5 15.5 9" />
      <rect x="3" y="4" width="18" height="17" rx="2" />
    </svg>
  )
}

export function IconUsers(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6" />
      <circle cx="17.5" cy="8.5" r="2.6" />
      <path d="M15 14.3c2.5.4 4.5 2.6 4.5 5.7" />
    </svg>
  )
}

export function IconClassGroups(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <rect x="3" y="3" width="7" height="7" rx="1.3" />
      <rect x="14" y="3" width="7" height="7" rx="1.3" />
      <rect x="3" y="14" width="7" height="7" rx="1.3" />
      <rect x="14" y="14" width="7" height="7" rx="1.3" />
    </svg>
  )
}

/** Same glyph as IconSubjects - the mockup reuses it for the row-level "teaching assignments" action. */
export function IconTeachingAssignments(props: IconProps) {
  return <IconSubjects {...props} />
}

export function IconEnvelope(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M4 4h13l3 3v13H4Z" />
      <path d="M8 4v6l3-2 3 2V4" />
    </svg>
  )
}

export function IconEdit(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="m16.5 4.5 3 3L8 19H5v-3Z" />
    </svg>
  )
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...iconProps(props)} strokeWidth={2.2}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconInfo(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </svg>
  )
}

export function IconLogout(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
      <path d="m15 16 4-4-4-4" />
      <path d="M19 12H9" />
    </svg>
  )
}
