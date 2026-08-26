export type ApiErrorKind =
  | 'network' // request never reached the server
  | 'timeout' // server took too long to respond
  | 'unauthorized' // 401 — token missing, invalid, or expired
  | 'forbidden' // 403 — authenticated but not permitted
  | 'not_found' // 404
  | 'validation' // 400/422 — bad input, usually with field errors
  | 'server' // 5xx
  | 'contract' // response shape did not match contracts.ts
  | 'unknown'

/**
 * Every failure that leaves the service layer is an ApiError, so components
 * never have to branch on raw fetch/DOM exceptions.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  /** Field-level messages keyed by form field name, when the API supplies them. */
  readonly fieldErrors?: Record<string, string>

  constructor(
    kind: ApiErrorKind,
    message: string,
    options: {
      status?: number
      fieldErrors?: Record<string, string>
      cause?: unknown
    } = {},
  ) {
    // The original error is preserved on the standard `cause` property.
    super(message, { cause: options.cause })
    this.name = 'ApiError'
    this.kind = kind
    this.status = options.status
    this.fieldErrors = options.fieldErrors
    this.cause = options.cause
  }

  /** True when signing in again is likely to fix the problem. */
  get requiresReauth(): boolean {
    return this.kind === 'unauthorized'
  }

  /** True when retrying the same request could plausibly succeed. */
  get isRetryable(): boolean {
    return this.kind === 'network' || this.kind === 'timeout' || this.kind === 'server'
  }
}

/** A message safe and useful to show a non-technical user. */
export function toUserMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.kind) {
      case 'network':
        return 'Cannot reach the server. Check your internet connection and try again.'
      case 'timeout':
        return 'The server took too long to respond. Please try again.'
      case 'unauthorized':
        return 'Your session has expired. Please sign in again.'
      case 'forbidden':
        return 'You do not have permission to view this.'
      case 'not_found':
        return 'We could not find what you were looking for.'
      case 'validation':
        return error.message || 'Please check the highlighted fields and try again.'
      case 'server':
        return 'Something went wrong on the server. Please try again shortly.'
      case 'contract':
        return 'The server sent data in an unexpected format. Please report this to the team.'
      default:
        return error.message || 'Something went wrong. Please try again.'
    }
  }

  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.'
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  return new ApiError('unknown', 'Unexpected error', { cause: error })
}
