import { formatConfidence } from '@/lib/format'

/**
 * Plain-language reading of the model's confidence, so a non-technical judge or
 * field officer knows how much weight to give the result.
 */
function confidenceWording(confidence: number): string {
  if (confidence >= 0.85) return 'The model is highly confident in this result.'
  if (confidence >= 0.7) return 'The model is reasonably confident in this result.'
  if (confidence >= 0.5)
    return 'The model is only moderately confident. Treat this as a hint, not a decision.'
  return 'The model has low confidence. Please verify manually before acting.'
}

export function ConfidenceMeter({ confidence }: { confidence: number }) {
  const percentage = Math.round(Math.min(Math.max(confidence, 0), 1) * 100)

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink">Model confidence</span>
        <span className="text-sm font-semibold tabular-nums text-ink">
          {formatConfidence(confidence)}
        </span>
      </div>
      <div
        role="meter"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Model confidence"
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-line"
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">{confidenceWording(confidence)}</p>
    </div>
  )
}
