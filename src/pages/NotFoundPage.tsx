import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-sm font-semibold tracking-wide text-brand uppercase">
        Error 404
      </p>
      <h1 className="text-2xl font-semibold text-ink">Page not found</h1>
      <p className="max-w-sm text-sm text-muted">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        to="/dashboard"
        className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-strong"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
