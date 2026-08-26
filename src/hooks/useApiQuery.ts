import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError, normalizeError } from '@/services/apiError'

export interface ApiQueryState<T> {
  data: T | null
  error: ApiError | null
  isLoading: boolean
  /** True while a refetch runs but stale data is still on screen. */
  isRefreshing: boolean
  refetch: () => void
}

/**
 * Runs a service call on mount and whenever `deps` change, exposing the
 * loading/error/data triple every screen needs.
 *
 * The in-flight request is aborted when deps change or the component unmounts,
 * which prevents both wasted work and state updates after unmount.
 */
export function useApiQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
): ApiQueryState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  // Keep the latest fetcher without making it a dependency of the effect.
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const hasLoadedRef = useRef(false)

  useEffect(() => {
    const controller = new AbortController()

    if (hasLoadedRef.current) setIsRefreshing(true)
    else setIsLoading(true)

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return
        setData(result)
        setError(null)
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return
        setError(normalizeError(caught))
      })
      .finally(() => {
        if (controller.signal.aborted) return
        hasLoadedRef.current = true
        setIsLoading(false)
        setIsRefreshing(false)
      })

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken])

  const refetch = useCallback(() => setReloadToken((token) => token + 1), [])

  return { data, error, isLoading, isRefreshing, refetch }
}
