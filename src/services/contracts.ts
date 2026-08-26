import { z } from 'zod'

/*
 * ============================================================================
 * PLACEHOLDER — CONFIRM WITH BACKEND DEVELOPER
 * ============================================================================
 * Every schema below is an assumption made so the UI could be built before the
 * backend contract existed. None of it is agreed with the backend team yet.
 *
 * These schemas are the single source of truth for both TypeScript types and
 * runtime response validation. When the real contract arrives, edit this file
 * only; the services, hooks, and components pick up the change automatically.
 *
 * Tracking doc: docs/API_CONTRACT.md
 * ============================================================================
 */

export const userRoleSchema = z.enum(['admin', 'analyst', 'field_officer'])

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: userRoleSchema,
})

export const loginResponseSchema = z.object({
  token: z.string(),
  user: authUserSchema,
})

/** Ordered least to most severe; the UI relies on this order for sorting. */
export const riskLevelSchema = z.enum(['low', 'moderate', 'high', 'critical'])

/**
 * One explainability factor behind a prediction. `contribution` is a 0..1 share
 * of the model's decision weight, used to size the bars on the result card.
 */
export const predictionFactorSchema = z.object({
  label: z.string(),
  contribution: z.number().min(0).max(1),
  direction: z.enum(['increases', 'decreases']),
})

export const predictionResultSchema = z.object({
  id: z.string(),
  subjectLabel: z.string(),
  riskLevel: riskLevelSchema,
  /** Model confidence as a 0..1 fraction, NOT a percentage. */
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  recommendation: z.string(),
  factors: z.array(predictionFactorSchema),
  modelVersion: z.string(),
  createdAt: z.string(),
})

export const predictionHistorySchema = z.object({
  items: z.array(predictionResultSchema),
  page: z.number().int().nonnegative(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
})

export const dashboardSummarySchema = z.object({
  totalAssessments: z.number(),
  highRiskCount: z.number(),
  averageConfidence: z.number().min(0).max(1),
  modelVersion: z.string(),
  riskDistribution: z.array(
    z.object({ level: riskLevelSchema, count: z.number() }),
  ),
  trend: z.array(
    z.object({ date: z.string(), assessments: z.number(), highRisk: z.number() }),
  ),
})

export type UserRole = z.infer<typeof userRoleSchema>
export type AuthUser = z.infer<typeof authUserSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
export type RiskLevel = z.infer<typeof riskLevelSchema>
export type PredictionFactor = z.infer<typeof predictionFactorSchema>
export type PredictionResult = z.infer<typeof predictionResultSchema>
export type PredictionHistory = z.infer<typeof predictionHistorySchema>
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>

export interface LoginRequest {
  email: string
  password: string
}

/**
 * PLACEHOLDER — the real feature set depends on the problem statement and the
 * ML team's input schema. `features` is intentionally open so the Predict form
 * can be rewritten without touching the transport layer.
 */
export interface PredictionRequest {
  subjectLabel: string
  features: Record<string, string | number>
}
