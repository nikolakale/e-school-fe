/** Joins truthy class names - a tiny stand-in for `clsx` (no new deps). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
