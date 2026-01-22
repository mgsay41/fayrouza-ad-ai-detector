import { Trash2, Download, Filter } from 'lucide-react'
import { useI18n } from '../../i18n'
import { Button } from '../ui/button'
import { HistoryCard } from './HistoryCard'
import { HistoryCardSkeleton } from './HistoryCardSkeleton'
import type { AdHistoryItem } from '../../types'

interface HistoryListProps {
  history: AdHistoryItem[]
  isLoading?: boolean
  onDelete: (id: string) => void
  onView: (item: AdHistoryItem) => void
  onClearAll: () => void
  onExport: () => void
  filter?: 'all' | 'Approve' | 'Review' | 'Reject'
  onFilterChange?: (filter: 'all' | 'Approve' | 'Review' | 'Reject') => void
}

export function HistoryList({
  history,
  isLoading = false,
  onDelete,
  onView,
  onClearAll,
  onExport,
  filter = 'all',
  onFilterChange,
}: HistoryListProps) {
  const { t } = useI18n()

  const filteredHistory =
    filter === 'all' ? history : history.filter((item) => item.decision === filter)

  const stats = {
    total: history.length,
    approve: history.filter((item) => item.decision === 'Approve').length,
    review: history.filter((item) => item.decision === 'Review').length,
    reject: history.filter((item) => item.decision === 'Reject').length,
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-40 bg-muted rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          </div>
        </div>

        {/* Cards grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <HistoryCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 animate-in fade-in duration-300">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Filter className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-card-foreground mb-2">
          {t.view.history.noHistory}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {t.view.history.noHistoryDesc}
        </p>
      </div>
    )
  }

  // Get submission text (singular/plural)
  const submissionText = stats.total === 1
    ? t.view.history.subtitleSingular
    : t.view.history.subtitlePlural

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-card-foreground">
            {t.view.history.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {stats.total} {submissionText}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          {onFilterChange && (
            <div className="flex items-center gap-1 mr-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange('all')}
              >
                {t.history.filter.all} ({stats.total})
              </Button>
              <Button
                variant={filter === 'Approve' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange('Approve')}
                className="data-[variant=default]:bg-green-600 data-[variant=default]:hover:bg-green-700"
              >
                {t.history.filter.approve} ({stats.approve})
              </Button>
              <Button
                variant={filter === 'Review' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange('Review')}
                className="data-[variant=default]:bg-orange-600 data-[variant=default]:hover:bg-orange-700"
              >
                {t.history.filter.review} ({stats.review})
              </Button>
              <Button
                variant={filter === 'Reject' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange('Reject')}
                className="data-[variant=default]:bg-red-600 data-[variant=default]:hover:bg-red-700"
              >
                {t.history.filter.reject} ({stats.reject})
              </Button>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            {t.history.export}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t.history.clearAll}
          </Button>
        </div>
      </div>

      {/* History cards grid */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            {t.view.history.noFilterMatch}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHistory.map((item, index) => (
            <div
              key={item.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <HistoryCard
                item={item}
                onDelete={onDelete}
                onView={onView}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
