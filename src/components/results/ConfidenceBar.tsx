import { Progress } from '../ui'
import { useI18n } from '../../i18n'
import type { Decision } from '../../types'

interface ConfidenceBarProps {
  confidence: number
  decision: Decision
  className?: string
  showLabel?: boolean
}

export function ConfidenceBar({
  confidence,
  decision,
  className,
  showLabel = true
}: ConfidenceBarProps) {
  const { t } = useI18n()
  const percentage = Math.round(confidence * 100)

  const getColorClass = () => {
    switch (decision) {
      case 'Approve':
        return 'text-green-700'
      case 'Reject':
        return 'text-red-700'
      case 'Review':
        return 'text-orange-700'
    }
  }

  const getBarColorClass = () => {
    switch (decision) {
      case 'Approve':
        return 'bg-green-600'
      case 'Reject':
        return 'bg-red-600'
      case 'Review':
        return 'bg-orange-600'
    }
  }

  return (
    <div className={`space-y-2 ${className || ''}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-card-foreground">{t.results.confidence}</span>
          <span className={`font-bold ${getColorClass()}`}>{percentage}%</span>
        </div>
      )}
      <div className="relative">
        <Progress value={percentage} className="h-3" />
        <div
          className={`absolute left-0 top-0 h-3 rounded-full transition-all duration-500 ease-out ${getBarColorClass()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
