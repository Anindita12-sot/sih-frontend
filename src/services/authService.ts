import { z } from 'zod'

import { request } from '@/services/apiClient'
import {
  authUserSchema,
  loginResponseSchema,
  type AuthUser,
  type LoginRequest,
  type LoginResponse,
} from '@/services/contracts'

/**
 * PLACEHOLDER — CONFIRM WITH BACKEND DEVELOPER
 * Routes and payloads assumed; see docs/API_CONTRACT.md.
 */
export const authService = {
  login(credentials: LoginRequest, signal?: AbortSignal): Promise<LoginResponse> {
    return request('/auth/login', {
      method: 'POST',
      body: credentials,
      schema: loginResponseSchema,
      withAuth: false,
      signal,
    })
  },

  /** Used on app start to restore a session from a stored token. */
  getCurrentUser(signal?: AbortSignal): Promise<AuthUser> {
    return request('/auth/me', { schema: authUserSchema, signal })
  },

  logout(signal?: AbortSignal): Promise<unknown> {
    return request('/auth/logout', {
      method: 'POST',
      schema: z.unknown(),
      signal,
    })
  },
}
