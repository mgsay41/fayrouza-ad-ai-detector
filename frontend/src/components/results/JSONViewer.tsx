import { useState } from 'react'
import { ChevronDown, ChevronRight, Copy } from 'lucide-react'
import { useI18n } from '../../i18n'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { useToast } from '../../hooks/use-toast'

interface JSONViewerProps {
  data: unknown
  className?: string
}

export function JSONViewer({ data, className }: JSONViewerProps) {
  const { t } = useI18n()
  const [isExpanded, setIsExpanded] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    const jsonString = JSON.stringify(data, null, 2)
    try {
      await navigator.clipboard.writeText(jsonString)
      toast({
        title: t.results.jsonViewer.copied,
        description: t.results.jsonViewer.copiedDesc,
      })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t.results.jsonViewer.copyFailed,
        description: t.results.jsonViewer.copyFailedDesc,
      })
    }
  }

  const jsonString = JSON.stringify(data, null, 2)

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-muted/30 animate-in fade-in slide-in-from-top-2 duration-300',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-card-foreground hover:text-primary transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
          ) : (
            <ChevronRight className="h-4 w-4 transition-transform duration-200" />
          )}
          <span>{t.results.jsonViewer.title}</span>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 px-2 hover:bg-muted"
        >
          <Copy className="h-4 w-4 mr-1" />
          {t.results.jsonViewer.copy}
        </Button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 overflow-x-auto animate-in fade-in slide-in-from-top-1 duration-200">
          <pre className="text-xs text-muted-foreground font-mono">
            {jsonString}
          </pre>
        </div>
      )}
    </div>
  )
}
