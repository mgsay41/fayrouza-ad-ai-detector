import { X, Clock, Image as ImageIcon } from 'lucide-react'
import { useI18n } from '../../i18n'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { DecisionBadge } from '../results/DecisionBadge'
import { ConfidenceBar } from '../results/ConfidenceBar'
import { JSONViewer } from '../results/JSONViewer'
import { formatResponseTime } from '../../lib/utils'
import type { AdHistoryItem, Decision } from '../../types'

interface HistoryDetailProps {
  item: AdHistoryItem | null
  isOpen: boolean
  onClose: () => void
}

const decisionStyles: Record<Decision, string> = {
  Approve: 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950',
  Reject: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950',
  Review: 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950',
}

const categoryColors: Record<string, string> = {
  Electronics: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  Vehicles: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  'Real Estate': 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  Clothing: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
  'Home & Garden': 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  Services: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  Other: 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300',
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function HistoryDetail({ item, isOpen, onClose }: HistoryDetailProps) {
  const { t, format } = useI18n()

  if (!item) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-8">
              <DialogTitle className="text-xl mb-2">
                {item.adData.title}
              </DialogTitle>
              <DialogDescription>
                {format('history.detail.submittedOn', { date: formatDate(item.timestamp) })}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 absolute right-4 top-4"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ad Details Section */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <h3 className="font-semibold text-card-foreground">{t.history.detail.adDetails}</h3>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={categoryColors[item.adData.category]}>
                {item.adData.category}
              </Badge>
              <Badge variant="outline" className="font-mono">
                {formatPrice(item.adData.price)}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {item.adData.description}
            </p>

            {item.adData.imageData && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-card-foreground">
                    {t.history.detail.image}
                  </span>
                </div>
                <img
                  src={item.adData.imageData}
                  alt="Ad image"
                  className="rounded-md border border-border max-h-64 object-contain bg-muted"
                />
              </div>
            )}
          </div>

          {/* AI Analysis Result Section */}
          <div className={`rounded-lg border-2 p-4 ${decisionStyles[item.decision]}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-card-foreground mb-1">
                  {t.history.detail.aiResult}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t.history.detail.aiResultDesc}
                </p>
              </div>
              <DecisionBadge decision={item.decision} />
            </div>

            <div className="mb-4">
              <ConfidenceBar confidence={item.confidence} decision={item.decision} />
            </div>

            <div className="mb-3">
              <h4 className="font-medium text-card-foreground mb-2">{t.results.reasoning}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.reasoning}
              </p>
            </div>

            {item.violations && item.violations.length > 0 && (
              <div className="mb-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <h4 className="font-medium text-destructive mb-2">
                  {t.results.violations}
                </h4>
                <ul className="space-y-1">
                  {item.violations.map((violation, index) => (
                    <li
                      key={index}
                      className="text-sm text-destructive flex items-start gap-2"
                    >
                      <span className="text-destructive/70">•</span>
                      <span>{violation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {item.recommendations && item.recommendations.length > 0 && (
              <div className="rounded-lg bg-muted/50 border border-border p-3">
                <h4 className="font-medium text-card-foreground mb-2">
                  {t.results.recommendations}
                </h4>
                <ul className="space-y-1">
                  {item.recommendations.map((recommendation, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-muted-foreground/70">•</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {item.responseTime && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50 mt-3">
                <Clock className="h-3 w-3" />
                <span>{format('results.responseTime', { time: formatResponseTime(item.responseTime) })}</span>
              </div>
            )}
          </div>

          {/* JSON Response Section */}
          {item.rawResponse != null && (
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">
                {t.history.detail.fullResponse}
              </h3>
              <JSONViewer data={item.rawResponse} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
