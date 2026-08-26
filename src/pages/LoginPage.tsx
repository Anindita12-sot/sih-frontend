import { ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { useAuth } from '@/auth/useAuth'
import { Alert } from '@/components/feedback/StateViews'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { env } from '@/config/env'
import { ApiError, toUserMessage } from '@/services/apiError'

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .pipe(z.email('Enter a valid email address')),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

type FieldErrors = Partial<Record<'email' | 'password', string>>

export function LoginPage() {
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? '/dashboard'} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      const errors: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (field === 'email' || field === 'password') {
          errors[field] ??= issue.message
        }
      }
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await login(parsed.data)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? '/dashboard', { replace: true })
    } catch (error) {
      // Prefer field-level messages from the API when it provides them.
      if (error instanceof ApiError && error.fieldErrors) {
        setFieldErrors(error.fieldErrors as FieldErrors)
      }
      setFormError(toUserMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-brand text-white">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold text-ink">{env.appName}</h1>
          <p className="mt-1 text-sm text-muted">Sign in to continue</p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 rounded-card border border-line bg-surface p-6 shadow-sm"
        >
          {formError && <Alert tone="danger">{formError}</Alert>}

          <TextField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
            placeholder="you@department.gov.in"
          />

          <TextField
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isSubmitting}
            loadingText="Signing in…"
          >
            Sign in
          </Button>
        </form>

      </div>
    </div>
  )
}
