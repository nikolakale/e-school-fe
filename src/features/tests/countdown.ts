/**
 * Pure clock math for the test-taking countdown, kept apart from React so it
 * can be reasoned about (and tested) without mounting a component.
 */

/** Seconds remaining until `deadlineIso`, floored at 0. */
export function secondsUntil(deadlineIso: string, now: Date = new Date()): number {
  return Math.max(0, Math.round((new Date(deadlineIso).getTime() - now.getTime()) / 1000))
}

/** Formats a second count as "m:ss", e.g. 65 -> "1:05". */
export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
