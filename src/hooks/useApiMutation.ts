import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError, normalizeError } from '@/services/apiError'

export interface ApiMutationState<TInput, TResult> {
  mutate: (input: TInput) => Promise<TResult | null>
  reset: () => void
  data: TResult | null
  error: ApiError | null
  isSubmitting: boolean
}

/**
 * Wraps a write operation (submit, save, delete) with submit/error state and
 * guards against double submission and post-unmount state updates.
 */
export function useApiMutation<TInput, TResult>(
  mutation: (input: TInput, signal: AbortSignal) => Promise<TResult>,
): ApiMutationState<TInput, TResult> {
  const [data, setData] = useState<TResult | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const mutationRef = useRef(mutation)
  mutationRef.current = mutation

  const controllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      controllerRef.current?.abort()
    }
  }, [])

  const mutate = useCallback(async (input: TInput): Promise<TResult | null> => {
    // Cancel any previous attempt so the last submission wins.
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await mutationRef.current(input, controller.signal)
      if (!isMountedRef.current || controller.signal.aborted) return null
      setData(result)
      return result
    } catch (caught) {
      if (!isMountedRef.current || controller.signal.aborted) return null
      setError(normalizeError(caught))
      return null
    } finally {
      if (isMountedRef.current && !controller.signal.aborted) {
        setIsSubmitting(false)
      }
    }
  }, [])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsSubmitting(false)
  }, [])

  return { mutate, reset, data, error, isSubmitting }
}
