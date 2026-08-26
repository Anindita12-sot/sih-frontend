import type { z } from 'zod'

import { env } from '@/config/env'
import { ApiError } from '@/services/apiError'
import { handleMockRequest } from '@/services/mock/mockRouter'
import { tokenStorage } from '@/services/tokenStorage'

export interface RequestOptions<TSchema extends z.ZodType> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Schema used to validate the response before it reaches the UI. */
  schema: TSchema
  /** Allows callers to cancel in-flight requests (see useApi). */
  signal?: AbortSignal
  /** Set false for endpoints that must not send the auth header. */
  withAuth?: boolean
}

type UnauthorizedHandler = () => void

let onUnauthorized: UnauthorizedHandler | null = null

/**
 * Registered once by the auth provider so a 401 anywhere in the app can clear
 * the session, without the service layer importing React state.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler
}

function statusToKind(status: number) {
  if (status === 401) return 'unauthorized' as const
  if (status === 403) return 'forbidden' as const
  if (status === 404) return 'not_found' as const
  if (status === 400 || status === 422) return 'validation' as const
  if (status >= 500) return 'server' as const
  return 'unknown' as const
}

/**
 * PLACEHOLDER — CONFIRM WITH BACKEND DEVELOPER
 * Assumes errors arrive as JSON shaped like:
 *   { "message": "...", "errors": { "email": "..." } }
 * Adjust this function if the real error envelope differs.
 */
function parseErrorPayload(payload: unknown): {
  message?: string
  fieldErrors?: Record<string, string>
} {
  if (typeof payload !== 'object' || payload === null) return {}

  const record = payload as Record<string, unknown>
  const message =
    typeof record.message === 'string'
      ? record.message
      : typeof record.detail === 'string'
        ? record.detail
        : undefined

  let fieldErrors: Record<string, string> | undefined
  if (typeof record.errors === 'object' && record.errors !== null) {
    fieldErrors = {}
    for (const [field, value] of Object.entries(record.errors)) {
      if (typeof value === 'string') fieldErrors[field] = value
      else if (Array.isArray(value) && typeof value[0] === 'string')
        fieldErrors[field] = value[0]
    }
  }

  return { message, fieldErrors }
}

export async function request<TSchema extends z.ZodType>(
  path: string,
  options: RequestOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  const { method = 'GET', body, schema, signal, withAuth = true } = options

  let raw: unknown

  if (env.useMockApi) {
    raw = await handleMockRequest({ path, method, body, signal })
  } else {
    raw = await performFetch({ path, method, body, signal, withAuth })
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    if (env.isDev) {
      console.error(
        `[api] Response for ${method} ${path} did not match the expected contract.`,
        { issues: parsed.error.issues, received: raw },
      )
    }
    throw new ApiError(
      'contract',
      `Unexpected response shape from ${method} ${path}`,
      { cause: parsed.error },
    )
  }

  return parsed.data
}

async function performFetch(args: {
  path: string
  method: string
  body: unknown
  signal?: AbortSignal
  withAuth: boolean
}): Promise<unknown> {
  const { path, method, body, signal, withAuth } = args

  const timeoutController = new AbortController()
  const timeoutId = window.setTimeout(
    () => timeoutController.abort(),
    env.apiTimeoutMs,
  )

  // Abort if either the caller cancels or the timeout fires.
  const signals = signal ? [signal, timeoutController.signal] : [timeoutController.signal]

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (withAuth) {
    const token = tokenStorage.get()
    // PLACEHOLDER — CONFIRM WITH BACKEND DEVELOPER: Bearer scheme assumed.
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.any(signals),
    })
  } catch (error) {
    if (signal?.aborted) throw error // Caller cancelled deliberately.
    if (timeoutController.signal.aborted) {
      throw new ApiError('timeout', 'Request timed out', { cause: error })
    }
    throw new ApiError('network', 'Network request failed', { cause: error })
  } finally {
    window.clearTimeout(timeoutId)
  }

  if (response.status === 204) return null

  const text = await response.text()
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    const kind = statusToKind(response.status)
    const { message, fieldErrors } = parseErrorPayload(payload)

    if (kind === 'unauthorized') onUnauthorized?.()

    throw new ApiError(kind, message ?? `Request failed (${response.status})`, {
      status: response.status,
      fieldErrors,
    })
  }

  return payload
}
