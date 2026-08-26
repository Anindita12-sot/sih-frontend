import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { ApiError, toUserMessage } from '@/services/apiError'

/** Grey placeholder block used to preserve layout while data loads. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-line/70', className)}
    />
  )
}

export function LoadingState({
  label = 'Loading…',
  rows = 3,
}: {
  label?: string
  rows?: number
}) {
  return (
    <div role="status" aria-live="polite" className="space-y-3 p-5">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-canvas text-muted">
        {icon ?? <Inbox className="size-6" aria-hidden="true" />}
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({
  error,
  onRetry,
  title = 'Something went wrong',
}: {
  error: unknown
  onRetry?: () => void
  title?: string
}) {
  const canRetry = !(error instanceof ApiError) || error.isRetryable

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center px-6 py-14 text-center"
    >
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted">{toUserMessage(error)}</p>
      {onRetry && canRetry && (
        <Button
          variant="secondary"
          className="mt-5"
          onClick={onRetry}
          leadingIcon={<RefreshCw className="size-4" aria-hidden="true" />}
        >
          Try again
        </Button>
      )}
    </div>
  )
}

type AlertTone = 'info' | 'success' | 'warning' | 'danger'

const alertToneClasses: Record<AlertTone, string> = {
  info: 'bg-brand-soft text-brand',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
}

export function Alert({
  tone = 'info',
  children,
  className,
}: {
  tone?: AlertTone
  children: ReactNode
  className?: string
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-lg px-4 py-3 text-sm font-medium',
        alertToneClasses[tone],
        className,
      )}
    >
      {children}
    </div>
  )
}
