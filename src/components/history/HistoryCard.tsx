import { Trash2, Eye } from 'lucide-react'
import { useI18n } from '../../i18n'
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { formatResponseTime } from '../../lib/utils'
import type { AdHistoryItem } from '../../types'

interface HistoryCardProps {
  item: AdHistoryItem
  onDelete: (id: string) => void
  onView: (item: AdHistoryItem) => void
}

const decisionColors: Record<string, string> = {
  Approve: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  Reject: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  Review: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
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

export function HistoryCard({ item, onDelete, onView }: HistoryCardProps) {
  const { t } = useI18n()

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  // Get translated decision label
  const getDecisionLabel = () => {
    switch (item.decision) {
      case 'Approve':
        return t.results.decision.approve
      case 'Reject':
        return t.results.decision.reject
      case 'Review':
        return t.results.decision.review
    }
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-card-foreground truncate">
              {item.adData.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(item.timestamp)}
            </p>
          </div>
          <Badge className={decisionColors[item.decision]}>
            {getDecisionLabel()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={categoryColors[item.adData.category]}>
            {item.adData.category}
          </Badge>
          <Badge variant="outline" className="font-mono">
            {formatPrice(item.adData.price)}
          </Badge>
          {item.responseTime && (
            <span className="text-xs text-muted-foreground">
              {formatResponseTime(item.responseTime)}
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {item.adData.description}
        </p>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t.history.confidence}</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                item.confidence >= 0.8
                  ? 'bg-green-500'
                  : item.confidence >= 0.5
                    ? 'bg-orange-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${item.confidence * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-card-foreground">
            {Math.round(item.confidence * 100)}%
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView(item)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {t.history.viewDetails}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
