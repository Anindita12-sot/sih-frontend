import type {
  AuthUser,
  DashboardSummary,
  PredictionResult,
  RiskLevel,
} from '@/services/contracts'

/*
 * DEMO DATA ONLY — never shipped as real output.
 * This module exists so the UI can be built and reviewed before the backend and
 * ML endpoints are ready. It is only reachable when VITE_USE_MOCK_API=true, and
 * the app shows a persistent "Demo data" banner whenever that flag is on.
 */

export const mockUser: AuthUser = {
  id: 'usr_001',
  name: 'Demo Analyst',
  email: 'analyst@sih.demo',
  role: 'analyst',
}

/** Deterministic hash so the same input always yields the same demo result. */
function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const riskLevels: RiskLevel[] = ['low', 'moderate', 'high', 'critical']

export function buildMockPrediction(input: {
  subjectLabel: string
  features: Record<string, string | number>
}): PredictionResult {
  const seed = hashString(JSON.stringify(input))
  const riskLevel = riskLevels[seed % riskLevels.length] as RiskLevel
  const confidence = 0.62 + ((seed % 34) / 100)

  const summaries: Record<RiskLevel, string> = {
    low: 'Indicators are within the expected range. No immediate action needed.',
    moderate: 'Some indicators are trending unfavourably and warrant monitoring.',
    high: 'Multiple indicators exceed safe thresholds. Prompt review is advised.',
    critical: 'Indicators are severely outside safe limits. Escalate immediately.',
  }

  const recommendations: Record<RiskLevel, string> = {
    low: 'Continue routine monitoring and re-assess at the next scheduled cycle.',
    moderate: 'Schedule a follow-up assessment within 30 days.',
    high: 'Assign a field officer to verify on site within 7 days.',
    critical: 'Notify the district supervisor and begin intervention today.',
  }

  return {
    id: `pred_${seed.toString(36)}`,
    subjectLabel: input.subjectLabel,
    riskLevel,
    confidence: Math.min(confidence, 0.99),
    summary: summaries[riskLevel],
    recommendation: recommendations[riskLevel],
    factors: [
      { label: 'Primary indicator', contribution: 0.42, direction: 'increases' },
      { label: 'Historical trend', contribution: 0.27, direction: 'increases' },
      { label: 'Regional baseline', contribution: 0.19, direction: 'decreases' },
      { label: 'Reporting recency', contribution: 0.12, direction: 'decreases' },
    ],
    modelVersion: 'mock-0.0.0',
    createdAt: new Date().toISOString(),
  }
}

export const mockHistory: PredictionResult[] = [
  'Ward 12 — North Zone',
  'Ward 4 — Riverside',
  'Ward 27 — Industrial Belt',
  'Ward 9 — Old Town',
  'Ward 18 — Lake Area',
  'Ward 33 — Hill Colony',
].map((subjectLabel, index) => {
  const base = buildMockPrediction({ subjectLabel, features: { index } })
  return {
    ...base,
    createdAt: new Date(Date.now() - index * 36e5 * 9).toISOString(),
  }
})

export const mockDashboard: DashboardSummary = {
  totalAssessments: 1284,
  highRiskCount: 173,
  averageConfidence: 0.86,
  modelVersion: 'mock-0.0.0',
  riskDistribution: [
    { level: 'low', count: 642 },
    { level: 'moderate', count: 469 },
    { level: 'high', count: 132 },
    { level: 'critical', count: 41 },
  ],
  trend: Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.now() - (6 - index) * 864e5)
    return {
      date: date.toISOString().slice(0, 10),
      assessments: 120 + ((index * 37) % 90),
      highRisk: 12 + ((index * 13) % 24),
    }
  }),
}
