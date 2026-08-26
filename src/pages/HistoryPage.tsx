import { History } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/StateViews'
import { PageHeader } from '@/components/layout/PageHeader'
import { RiskBadge } from '@/components/ml/RiskBadge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { SelectField } from '@/components/ui/Field'
import { useApiQuery } from '@/hooks/useApiQuery'
import { formatConfidence, formatDateTime } from '@/lib/format'
import type { RiskLevel } from '@/services/contracts'
import { predictionService } from '@/services/predictionService'

const riskFilterOptions = [
  { value: 'all', label: 'All risk levels' },
  { value: 'low', label: 'Low risk' },
  { value: 'moderate', label: 'Moderate risk' },
  { value: 'high', label: 'High risk' },
  { value: 'critical', label: 'Critical risk' },
]

export function HistoryPage() {
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all')

  const fetchHistory = useCallback(
    (signal: AbortSignal) => predictionService.list({ page: 0, pageSize: 50 }, signal),
    [],
  )

  const { data, error, isLoading, refetch } = useApiQuery(fetchHistory, [])

  // Filtering happens client-side for now; move it to a query parameter once
  // the backend supports server-side filtering and real pagination.
  const visibleItems = useMemo(() => {
    if (!data) return []
    if (riskFilter === 'all') return data.items
    return data.items.filter((item) => item.riskLevel === riskFilter)
  }, [data, riskFilter])

  return (
    <>
      <PageHeader
        title="Assessment history"
        description="Every assessment run by your team, most recent first."
      />

      <Card>
        <div className="border-b border-line px-5 py-4">
          <div className="max-w-xs">
            <SelectField
              label="Filter by risk level"
              options={riskFilterOptions}
              value={riskFilter}
              onChange={(event) =>
                setRiskFilter(event.target.value as 'all' | RiskLevel)
              }
            />
          </div>
        </div>

        {isLoading && <LoadingState rows={5} label="Loading history" />}

        {!isLoading && error && (
          <ErrorState
            error={error}
            onRetry={refetch}
            title="Could not load history"
          />
        )}

        {!isLoading && !error && visibleItems.length === 0 && (
          <EmptyState
            icon={<History className="size-6" aria-hidden="true" />}
            title={
              riskFilter === 'all'
                ? 'No assessments yet'
                : 'No assessments at this risk level'
            }
            description={
              riskFilter === 'all'
                ? 'Once your team runs an assessment, it will show up here.'
                : 'Try a different filter to see more results.'
            }
            action={
              riskFilter === 'all' ? (
                <Link
                  to="/assess"
                  className="inline-flex h-11 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-strong"
                >
                  Run an assessment
                </Link>
              ) : (
                <Button variant="secondary" onClick={() => setRiskFilter('all')}>
                  Clear filter
                </Button>
              )
            }
          />
        )}

        {!isLoading && !error && visibleItems.length > 0 && (
          <>
            {/* Table on wide screens. */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Assessment history, most recent first
                </caption>
                <thead className="border-b border-line text-xs tracking-wide text-muted uppercase">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium">Subject</th>
                    <th scope="col" className="px-5 py-3 font-medium">Risk</th>
                    <th scope="col" className="px-5 py-3 font-medium">Confidence</th>
                    <th scope="col" className="px-5 py-3 font-medium">Assessed</th>
                    <th scope="col" className="px-5 py-3 font-medium">Model</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((item) => (
                    <tr key={item.id} className="border-b border-line last:border-0">
                      <th
                        scope="row"
                        className="max-w-xs truncate px-5 py-3 font-medium text-ink"
                      >
                        {item.subjectLabel}
                      </th>
                      <td className="px-5 py-3">
                        <RiskBadge level={item.riskLevel} />
                      </td>
                      <td className="px-5 py-3 tabular-nums text-muted">
                        {formatConfidence(item.confidence)}
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-muted">{item.modelVersion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Stacked cards on small screens, where a table would overflow. */}
            <ul className="divide-y divide-line md:hidden">
              {visibleItems.map((item) => (
                <li key={item.id}>
                  <CardBody className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-ink">{item.subjectLabel}</p>
                      <RiskBadge level={item.riskLevel} />
                    </div>
                    <p className="text-xs text-muted">
                      {formatConfidence(item.confidence)} confidence ·{' '}
                      {formatDateTime(item.createdAt)}
                    </p>
                  </CardBody>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  )
}
