import { z } from 'zod'

/**
 * Environment contract for the frontend.
 *
 * Parsed once at module load so a misconfigured deploy fails immediately with a
 * readable message, rather than surfacing as a confusing network error later.
 */
const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1).default('SIH Platform'),
  VITE_API_BASE_URL: z.string().min(1).default('/api'),
  VITE_USE_MOCK_API: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  VITE_API_TIMEOUT_MS: z.coerce.number().int().positive().default(20000),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n')

  throw new Error(
    `Invalid frontend environment configuration:\n${issues}\n\n` +
      'Copy .env.example to .env.local and fill in the required values.',
  )
}

export const env = {
  appName: parsed.data.VITE_APP_NAME,
  apiBaseUrl: parsed.data.VITE_API_BASE_URL.replace(/\/$/, ''),
  useMockApi: parsed.data.VITE_USE_MOCK_API,
  apiTimeoutMs: parsed.data.VITE_API_TIMEOUT_MS,
  isDev: import.meta.env.DEV,
} as const
