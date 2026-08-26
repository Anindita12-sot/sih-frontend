import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '@/auth/AuthProvider'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { AppShell } from '@/components/layout/AppShell'
import { Spinner } from '@/components/ui/Spinner'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

/*
 * The authenticated screens are loaded on demand. This keeps the charting
 * library out of the initial download, so the login screen — the first thing a
 * judge sees — loads fast even on a weak venue connection.
 */
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const AssessPage = lazy(() =>
  import('@/pages/AssessPage').then((m) => ({ default: m.AssessPage })),
)
const HistoryPage = lazy(() =>
  import('@/pages/HistoryPage').then((m) => ({ default: m.HistoryPage })),
)

function RouteFallback() {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <Spinner size="lg" className="text-brand" />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/assess" element={<AssessPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
