import type { RoleSlug } from './types'

/** Role badge color pairs, ported 1:1 from the approved mockup's tokens. */
export const ROLE_COLORS: Record<RoleSlug, { fg: string; bg: string }> = {
  ucenik: { fg: 'var(--role-ucenik-fg)', bg: 'var(--role-ucenik-bg)' },
  nastavnik: { fg: 'var(--role-nastavnik-fg)', bg: 'var(--role-nastavnik-bg)' },
  razredni_staresina: { fg: 'var(--role-razredni-fg)', bg: 'var(--role-razredni-bg)' },
  direktor: { fg: 'var(--role-direktor-fg)', bg: 'var(--role-direktor-bg)' },
  strucni_saradnik: { fg: 'var(--role-strucni-fg)', bg: 'var(--role-strucni-bg)' },
  roditelj: { fg: 'var(--role-roditelj-fg)', bg: 'var(--role-roditelj-bg)' },
}

/** "Milica Kovačević" -> "MK" - for avatar initials. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
