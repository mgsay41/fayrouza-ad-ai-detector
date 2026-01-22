import { Skeleton } from '../ui/skeleton'

export function ResultsDisplaySkeleton() {
  return (
    <div className="space-y-4">
      {/* Main Result Card */}
      <div className="rounded-lg border-2 border-border p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>

        {/* Confidence Bar */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>

        {/* Reasoning */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        {/* Response Time */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* JSON Viewer Skeleton */}
      <div className="rounded-lg border border-border bg-muted/30">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  )
}
