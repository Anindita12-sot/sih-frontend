import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { AuthContext, type AuthStatus } from '@/auth/authContext'
import { setUnauthorizedHandler } from '@/services/apiClient'
import { authService } from '@/services/authService'
import type { AuthUser, LoginRequest } from '@/services/contracts'
import { tokenStorage } from '@/services/tokenStorage'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('checking')

  const clearSession = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  // Any 401 from the service layer ends the session, wherever it originated.
  useEffect(() => {
    setUnauthorizedHandler(clearSession)
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  // Restore the session on load if a token survived the last visit.
  useEffect(() => {
    const token = tokenStorage.get()
    if (!token) {
      setStatus('unauthenticated')
      return
    }

    const controller = new AbortController()

    authService
      .getCurrentUser(controller.signal)
      .then((currentUser) => {
        if (controller.signal.aborted) return
        setUser(currentUser)
        setStatus('authenticated')
      })
      .catch(() => {
        if (controller.signal.aborted) return
        clearSession()
      })

    return () => controller.abort()
  }, [clearSession])

  const login = useCallback(async (credentials: LoginRequest) => {
    // Errors intentionally propagate so the form can show field-level messages.
    const response = await authService.login(credentials)
    tokenStorage.set(response.token)
    setUser(response.user)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // Signing out locally must succeed even if the server call fails.
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo(
    () => ({ status, user, login, logout }),
    [status, user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
