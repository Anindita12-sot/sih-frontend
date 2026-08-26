import { ApiError } from '@/services/apiError'
import type { LoginRequest, PredictionRequest } from '@/services/contracts'
import {
  buildMockPrediction,
  mockDashboard,
  mockHistory,
  mockUser,
} from '@/services/mock/fixtures'

/*
 * In-memory stand-in for the backend, active only when VITE_USE_MOCK_API=true.
 * It mirrors the routes in docs/API_CONTRACT.md so that flipping the flag to
 * false is the only change needed once the real backend is live.
 */

interface MockRequest {
  path: string
  method: string
  body: unknown
  signal?: AbortSignal
}

/** Simulate latency so loading states are actually visible while developing. */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timeoutId)
        reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}

const sessionPredictions = [...mockHistory]

export async function handleMockRequest({
  path,
  method,
  body,
  signal,
}: MockRequest): Promise<unknown> {
  await delay(500 + Math.random() * 400, signal)

  const route = `${method} ${path.split('?')[0]}`

  switch (route) {
    case 'POST /auth/login': {
      const credentials = body as LoginRequest
      if (!credentials?.email || !credentials?.password) {
        throw new ApiError('validation', 'Email and password are required.', {
          status: 422,
        })
      }
      // Any password of 6+ characters signs in during the demo.
      if (credentials.password.length < 6) {
        throw new ApiError('unauthorized', 'Invalid email or password.', {
          status: 401,
        })
      }
      return {
        token: 'mock-token',
        user: { ...mockUser, email: credentials.email },
      }
    }

    case 'GET /auth/me':
      return mockUser

    case 'POST /auth/logout':
      return null

    case 'POST /predictions': {
      const payload = body as PredictionRequest
      const result = buildMockPrediction(payload)
      sessionPredictions.unshift(result)
      return result
    }

    case 'GET /predictions':
      return {
        items: sessionPredictions,
        page: 0,
        pageSize: sessionPredictions.length,
        total: sessionPredictions.length,
      }

    case 'GET /dashboard/summary':
      return mockDashboard

    default:
      throw new ApiError('not_found', `No mock handler for ${route}`, {
        status: 404,
      })
  }
}
