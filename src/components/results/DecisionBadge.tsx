import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useI18n } from '../../i18n'
import type { Decision } from '../../types'

interface DecisionBadgeProps {
  decision: Decision
  className?: string
}

export function DecisionBadge({ decision, className }: DecisionBadgeProps) {
  const { t } = useI18n()

  const getIcon = () => {
    switch (decision) {
      case 'Approve':
        return <CheckCircle2 className="h-6 w-6" />
      case 'Reject':
        return <XCircle className="h-6 w-6" />
      case 'Review':
        return <AlertCircle className="h-6 w-6" />
    }
  }

  const getLabel = () => {
    switch (decision) {
      case 'Approve':
        return t.results.decision.approve
      case 'Reject':
        return t.results.decision.reject
      case 'Review':
        return t.results.decision.review
    }
  }

  const getClasses = (): string => {
    const base = 'inline-flex items-center gap-2 rounded-full border px-4 py-2 font-semibold'
    if (className) return `${base} ${className}`
    switch (decision) {
      case 'Approve':
        return `${base} text-green-700 bg-green-100 border-green-200 dark:text-green-300 dark:bg-green-950 dark:border-green-900`
      case 'Reject':
        return `${base} text-red-700 bg-red-100 border-red-200 dark:text-red-300 dark:bg-red-950 dark:border-red-900`
      case 'Review':
        return `${base} text-orange-700 bg-orange-100 border-orange-200 dark:text-orange-300 dark:bg-orange-950 dark:border-orange-900`
    }
  }

  return (
    <div className={getClasses()}>
      {getIcon()}
      <span>{getLabel()}</span>
    </div>
  )
}
