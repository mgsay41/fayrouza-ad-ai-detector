import { Clock, AlertTriangle, Lightbulb } from 'lucide-react'
import { useI18n } from '../../i18n'
import { formatResponseTime } from '../../lib/utils'
import { DecisionBadge } from './DecisionBadge'
import { ConfidenceBar } from './ConfidenceBar'
import { JSONViewer } from './JSONViewer'
import type { AIResponse, Decision } from '../../types'

interface ResultsDisplayProps {
  data: AIResponse
  onNewSubmission?: () => void
  className?: string
}

const decisionStyles: Record<Decision, string> = {
  Approve: 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950',
  Reject: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950',
  Review: 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950',
}

export function ResultsDisplay({ data, onNewSubmission, className }: ResultsDisplayProps) {
  const { t, format } = useI18n()

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Main Result Card */}
      <div className={`rounded-lg border-2 p-6 ${decisionStyles[data.decision]}`}>
        {/* Header with Decision Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-card-foreground mb-1">
              {t.results.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t.results.subtitle}
            </p>
          </div>
          <DecisionBadge decision={data.decision} />
        </div>

        {/* Confidence Bar */}
        <div className="mb-6">
          <ConfidenceBar confidence={data.confidence} decision={data.decision} />
        </div>

        {/* Reasoning */}
        <div className="mb-4">
          <h3 className="font-semibold text-card-foreground mb-2 flex items-center gap-2">
            <span>{t.results.reasoning}</span>
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{data.reasoning}</p>
        </div>

        {/* Violations */}
        {data.violations && data.violations.length > 0 && (
          <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-4">
            <h3 className="font-semibold text-destructive mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{t.results.violations}</span>
            </h3>
            <ul className="space-y-2">
              {data.violations.map((violation, index) => (
                <li key={index} className="text-sm text-destructive flex items-start gap-2">
                  <span className="text-destructive/70 mt-0.5">•</span>
                  <span>{violation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <div className="mb-4 rounded-lg bg-muted/50 border border-border p-4">
            <h3 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span>{t.results.recommendations}</span>
            </h3>
            <ul className="space-y-2">
              {data.recommendations.map((recommendation, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-muted-foreground/70 mt-0.5">•</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Response Time */}
        {data.responseTime && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
            <Clock className="h-3 w-3" />
            <span>{format('results.responseTime', { time: formatResponseTime(data.responseTime) })}</span>
          </div>
        )}
      </div>

      {/* JSON Viewer */}
      {data.rawResponse != null && <JSONViewer data={data.rawResponse} />}

      {/* Actions */}
      {onNewSubmission && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onNewSubmission}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
          >
            {t.results.submitAnother}
          </button>
        </div>
      )}
    </div>
  )
}
