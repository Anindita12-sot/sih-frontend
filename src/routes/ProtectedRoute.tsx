import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/auth/useAuth'
import { Spinner } from '@/components/ui/Spinner'

/**
 * Blocks rendering until the session check finishes, so a refresh on a private
 * route does not flash the login page before the token is validated.
 */
export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" className="text-brand" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    // Remember where the user was headed so login can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
