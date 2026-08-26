const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const dateFormatter = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' })

/** Format an ISO timestamp for display, falling back to the raw value. */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  return Number.isNaN(date.getTime()) ? isoString : dateTimeFormatter.format(date)
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return Number.isNaN(date.getTime()) ? isoString : dateFormatter.format(date)
}

/** Render a 0..1 model confidence as a whole percentage. */
export function formatConfidence(confidence: number): string {
  const clamped = Math.min(Math.max(confidence, 0), 1)
  return `${Math.round(clamped * 100)}%`
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(value)
}
