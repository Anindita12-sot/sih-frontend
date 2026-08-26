import { request } from '@/services/apiClient'
import {
  dashboardSummarySchema,
  predictionHistorySchema,
  predictionResultSchema,
  type DashboardSummary,
  type PredictionHistory,
  type PredictionRequest,
  type PredictionResult,
} from '@/services/contracts'

/**
 * PLACEHOLDER — CONFIRM WITH BACKEND DEVELOPER
 *
 * The frontend never runs a model; it only submits validated input and renders
 * whatever the backend returns from the ML service.
 * See docs/API_CONTRACT.md.
 */
export const predictionService = {
  create(
    payload: PredictionRequest,
    signal?: AbortSignal,
  ): Promise<PredictionResult> {
    return request('/predictions', {
      method: 'POST',
      body: payload,
      schema: predictionResultSchema,
      signal,
    })
  },

  list(
    params: { page?: number; pageSize?: number } = {},
    signal?: AbortSignal,
  ): Promise<PredictionHistory> {
    const query = new URLSearchParams()
    if (params.page !== undefined) query.set('page', String(params.page))
    if (params.pageSize !== undefined) query.set('pageSize', String(params.pageSize))
    const queryString = query.toString()
    const suffix = queryString ? `?${queryString}` : ''

    return request(`/predictions${suffix}`, {
      schema: predictionHistorySchema,
      signal,
    })
  },

  dashboardSummary(signal?: AbortSignal): Promise<DashboardSummary> {
    return request('/dashboard/summary', {
      schema: dashboardSummarySchema,
      signal,
    })
  },
}
