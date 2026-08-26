import { Activity, AlertOctagon, Gauge, RefreshCw } from 'lucide-react'
import { useCallback, type ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ErrorState, LoadingState } from '@/components/feedback/StateViews'
import { PageHeader } from '@/components/layout/PageHeader'
import { riskPresentation } from '@/components/ml/RiskBadge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { useApiQuery } from '@/hooks/useApiQuery'
import { formatCompactNumber, formatConfidence, formatDate } from '@/lib/format'
import { predictionService } from '@/services/predictionService'

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: string
  hint?: string
  icon: ReactNode
}) {
  return (
    <Card>
      <CardBody className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums text-ink">
            {value}
          </p>
          {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
        </div>
      </CardBody>
    </Card>
  )
}

export function DashboardPage() {
  const fetchSummary = useCallback(
    (signal: AbortSignal) => predictionService.dashboardSummary(signal),
    [],
  )

  const { data, error, isLoading, isRefreshing, refetch } =
    useApiQuery(fetchSummary, [])

  if (isLoading) {
    return (
      <>
        <PageHeader title="Dashboard" description="Loading the latest figures…" />
        <Card>
          <LoadingState rows={5} label="Loading dashboard" />
        </Card>
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <Card>
          <ErrorState
            error={error}
            onRetry={refetch}
            title="Could not load the dashboard"
          />
        </Card>
      </>
    )
  }

  const distribution = data.riskDistribution.map((entry) => ({
    ...entry,
    label: riskPresentation[entry.level].label,
    fill: riskPresentation[entry.level].chartColor,
  }))

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Model ${data.modelVersion} · updated just now`}
        action={
          <Button
            variant="secondary"
            onClick={refetch}
            isLoading={isRefreshing}
            loadingText="Refreshing…"
            leadingIcon={<RefreshCw className="size-4" aria-hidden="true" />}
          >
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total assessments"
          value={formatCompactNumber(data.totalAssessments)}
          icon={<Activity className="size-5" aria-hidden="true" />}
        />
        <StatCard
          label="High or critical risk"
          value={formatCompactNumber(data.highRiskCount)}
          hint={`${Math.round((data.highRiskCount / Math.max(data.totalAssessments, 1)) * 100)}% of all assessments`}
          icon={<AlertOctagon className="size-5" aria-hidden="true" />}
        />
        <StatCard
          label="Average confidence"
          value={formatConfidence(data.averageConfidence)}
          hint="Across all assessments"
          icon={<Gauge className="size-5" aria-hidden="true" />}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Risk distribution"
            description="How assessments are spread across risk levels"
          />
          <CardBody>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: 'var(--muted)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'var(--muted)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--canvas)' }}
                    contentStyle={{
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--line)',
                      borderRadius: 10,
                      color: 'var(--ink)',
                    }}
                  />
                  <Bar dataKey="count" name="Assessments" radius={[6, 6, 0, 0]}>
                    {distribution.map((entry) => (
                      <Cell key={entry.level} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Last 7 days"
            description="Assessment volume and high-risk findings"
          />
          <CardBody>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12, fill: 'var(--muted)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'var(--muted)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    labelFormatter={(value) => formatDate(String(value))}
                    contentStyle={{
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--line)',
                      borderRadius: 10,
                      color: 'var(--ink)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="assessments"
                    name="Assessments"
                    stroke="var(--brand)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="highRisk"
                    name="High risk"
                    stroke="var(--danger)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
