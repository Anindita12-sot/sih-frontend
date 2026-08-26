import { ArrowDownRight, ArrowUpRight, Info } from 'lucide-react'

import { ConfidenceMeter } from '@/components/ml/ConfidenceMeter'
import { RiskBadge } from '@/components/ml/RiskBadge'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { formatDateTime } from '@/lib/format'
import type { PredictionResult } from '@/services/contracts'

/**
 * Renders exactly what the backend returned from the ML service. It performs no
 * inference and invents no fields: if the contract drops `factors` or
 * `recommendation`, those sections simply do not render.
 */
export function PredictionResultCard({ result }: { result: PredictionResult }) {
  const hasFactors = result.factors.length > 0

  return (
    <Card>
      <CardHeader
        title={result.subjectLabel}
        description={`Assessed ${formatDateTime(result.createdAt)}`}
        action={<RiskBadge level={result.riskLevel} />}
      />
      <CardBody className="space-y-6">
        <p className="text-sm leading-relaxed text-ink">{result.summary}</p>

        <ConfidenceMeter confidence={result.confidence} />

        {result.recommendation && (
          <div className="rounded-lg bg-brand-soft px-4 py-3">
            <h3 className="text-xs font-semibold tracking-wide text-brand uppercase">
              Recommended action
            </h3>
            <p className="mt-1 text-sm text-ink">{result.recommendation}</p>
          </div>
        )}

        {hasFactors && (
          <div>
            <h3 className="text-sm font-medium text-ink">
              What influenced this result
            </h3>
            <ul className="mt-3 space-y-3">
              {result.factors.map((factor) => (
                <li key={factor.label}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-1.5 text-ink">
                      {factor.direction === 'increases' ? (
                        <ArrowUpRight
                          className="size-4 text-danger"
                          aria-hidden="true"
                        />
                      ) : (
                        <ArrowDownRight
                          className="size-4 text-success"
                          aria-hidden="true"
                        />
                      )}
                      {factor.label}
                    </span>
                    <span className="tabular-nums text-muted">
                      {Math.round(factor.contribution * 100)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
                    <div
                      className={
                        factor.direction === 'increases'
                          ? 'h-full rounded-full bg-danger'
                          : 'h-full rounded-full bg-success'
                      }
                      style={{ width: `${Math.round(factor.contribution * 100)}%` }}
                    />
                  </div>
                  <p className="sr-only">
                    {factor.label} {factor.direction} the risk by{' '}
                    {Math.round(factor.contribution * 100)} percent.
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="flex items-start gap-2 border-t border-line pt-4 text-xs text-muted">
          <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>
            This is a decision-support estimate from model{' '}
            <code className="font-medium">{result.modelVersion}</code>, not a
            final judgement. A qualified official should confirm before acting.
          </span>
        </p>
      </CardBody>
    </Card>
  )
}
