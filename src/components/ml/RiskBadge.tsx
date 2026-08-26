import { Badge } from '@/components/ui/Badge'
import type { RiskLevel } from '@/services/contracts'

/** Human-facing wording and colour for each model risk level. */
export const riskPresentation: Record<
  RiskLevel,
  { label: string; tone: 'success' | 'warning' | 'danger'; chartColor: string }
> = {
  low: { label: 'Low risk', tone: 'success', chartColor: '#14804a' },
  moderate: { label: 'Moderate risk', tone: 'warning', chartColor: '#d08700' },
  high: { label: 'High risk', tone: 'danger', chartColor: '#e2603c' },
  critical: { label: 'Critical risk', tone: 'danger', chartColor: '#c0243c' },
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const { label, tone } = riskPresentation[level]
  return <Badge tone={tone}>{label}</Badge>
}
