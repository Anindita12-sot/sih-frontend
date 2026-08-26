import { Sparkles } from 'lucide-react'
import { useCallback, useState, type FormEvent } from 'react'
import { z } from 'zod'

import { Alert, EmptyState } from '@/components/feedback/StateViews'
import { PageHeader } from '@/components/layout/PageHeader'
import { PredictionResultCard } from '@/components/ml/PredictionResultCard'
import { Button } from '@/components/ui/Button'
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { useApiMutation } from '@/hooks/useApiMutation'
import { toUserMessage } from '@/services/apiError'
import type { PredictionRequest } from '@/services/contracts'
import { predictionService } from '@/services/predictionService'

/*
 * PLACEHOLDER — these input fields are generic stand-ins.
 * Replace them with the real features once the problem statement is chosen and
 * the ML team confirms the model's expected input schema. Only this schema and
 * the JSX below should need to change; the service layer stays as is.
 */
/**
 * Number inputs arrive as strings. Plain coercion would turn an empty field
 * into 0 and silently pass, so emptiness is rejected before converting.
 */
function numericInput(requiredMessage: string) {
  return z
    .string()
    .trim()
    .min(1, requiredMessage)
    .refine((value) => Number.isFinite(Number(value)), 'Enter a valid number')
    .transform(Number)
}

const assessmentSchema = z.object({
  subjectLabel: z
    .string()
    .trim()
    .min(2, 'Enter at least 2 characters')
    .max(80, 'Keep this under 80 characters'),
  region: z.string().min(1, 'Select a region'),
  primaryIndicator: numericInput('Primary indicator is required').pipe(
    z
      .number()
      .min(0, 'Cannot be negative')
      .max(1000, 'Value looks too large — please check'),
  ),
  observationPeriodDays: numericInput('Observation period is required').pipe(
    z
      .number()
      .int('Enter a whole number of days')
      .min(1, 'Must be at least 1 day')
      .max(365, 'Cannot exceed 365 days'),
  ),
  notes: z.string().max(500, 'Keep notes under 500 characters').optional(),
})

type FormValues = Record<keyof z.infer<typeof assessmentSchema>, string>
type FieldErrors = Partial<Record<keyof FormValues, string>>

const initialValues: FormValues = {
  subjectLabel: '',
  region: '',
  primaryIndicator: '',
  observationPeriodDays: '30',
  notes: '',
}

const regionOptions = [
  { value: 'north', label: 'North Zone' },
  { value: 'south', label: 'South Zone' },
  { value: 'east', label: 'East Zone' },
  { value: 'west', label: 'West Zone' },
]

export function AssessPage() {
  const [values, setValues] = useState<FormValues>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const submitAssessment = useCallback(
    (payload: PredictionRequest, signal: AbortSignal) =>
      predictionService.create(payload, signal),
    [],
  )

  const { mutate, data: result, error, isSubmitting, reset } =
    useApiMutation(submitAssessment)

  function setValue(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    // Clear the error as soon as the user starts fixing the field.
    setFieldErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsed = assessmentSchema.safeParse(values)
    if (!parsed.success) {
      const errors: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FormValues | undefined
        if (field) errors[field] ??= issue.message
      }
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})

    const { subjectLabel, ...features } = parsed.data
    await mutate({
      subjectLabel,
      features: {
        region: features.region,
        primaryIndicator: features.primaryIndicator,
        observationPeriodDays: features.observationPeriodDays,
        notes: features.notes ?? '',
      },
    })
  }

  function handleReset() {
    setValues(initialValues)
    setFieldErrors({})
    reset()
  }

  return (
    <>
      <PageHeader
        title="New assessment"
        description="Submit the details below to get a model-generated risk assessment."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Assessment input"
            description="All fields marked with * are required"
          />
          <CardBody>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <TextField
                label="Subject or location name"
                required
                value={values.subjectLabel}
                onChange={(event) => setValue('subjectLabel', event.target.value)}
                error={fieldErrors.subjectLabel}
                placeholder="e.g. Ward 12 — North Zone"
              />

              <SelectField
                label="Region"
                required
                options={regionOptions}
                placeholder="Select a region"
                value={values.region}
                onChange={(event) => setValue('region', event.target.value)}
                error={fieldErrors.region}
              />

              <TextField
                label="Primary indicator"
                type="number"
                inputMode="decimal"
                step="any"
                required
                value={values.primaryIndicator}
                onChange={(event) => setValue('primaryIndicator', event.target.value)}
                error={fieldErrors.primaryIndicator}
                hint="Placeholder metric — replace with the real feature from the ML team."
              />

              <TextField
                label="Observation period (days)"
                type="number"
                inputMode="numeric"
                required
                value={values.observationPeriodDays}
                onChange={(event) =>
                  setValue('observationPeriodDays', event.target.value)
                }
                error={fieldErrors.observationPeriodDays}
              />

              <TextAreaField
                label="Notes"
                value={values.notes}
                onChange={(event) => setValue('notes', event.target.value)}
                error={fieldErrors.notes}
                hint="Optional context for the reviewing officer."
              />

              {error && <Alert tone="danger">{toUserMessage(error)}</Alert>}

              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Analysing…"
                  leadingIcon={<Sparkles className="size-4" aria-hidden="true" />}
                >
                  Run assessment
                </Button>
                <Button type="button" variant="ghost" onClick={handleReset}>
                  Clear
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <div aria-live="polite">
          {result ? (
            <PredictionResultCard result={result} />
          ) : (
            <Card>
              <EmptyState
                icon={<Sparkles className="size-6" aria-hidden="true" />}
                title="No assessment yet"
                description="Fill in the form and run an assessment. The model's result, confidence, and recommended action will appear here."
              />
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
