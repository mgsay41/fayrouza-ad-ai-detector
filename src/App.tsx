import { useState, useEffect, useMemo } from 'react'
import { History, XCircle, CheckCircle2, AlertCircle } from 'lucide-react'
import { I18nProvider, useI18n } from './i18n'
import { ThemeProvider } from './hooks/useTheme'
import { RTLProvider } from './hooks/useRTL'
import { Layout } from './components/layout'
import { AdSubmissionForm } from './components/form'
import { ResultsDisplay } from './components/results'
import { HistoryList, HistoryDetail } from './components/history'
import { Toaster } from './components/ui/toaster'
import { Button } from './components/ui/button'
import { useAdSubmission } from './hooks/useAdSubmission'
import { useAdHistory } from './hooks/useAdHistory'
import { useToast } from './hooks/use-toast'
import { fileToBase64 } from './lib/utils'
import type { AdHistoryItem } from './types'

type ViewMode = 'form' | 'history'

function AppContent() {
  const { t, format } = useI18n()
  const { submit, reset, state } = useAdSubmission()
  const { history, addToHistory, removeFromHistory, clearHistory, exportHistory } =
    useAdHistory()
  const { toast } = useToast()

  const [viewMode, setViewMode] = useState<ViewMode>('form')
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<AdHistoryItem | null>(
    null
  )
  const [historyFilter, setHistoryFilter] = useState<
    'all' | 'Approve' | 'Review' | 'Reject'
  >('all')

  // Get translated decision label
  const getDecisionLabel = (decision: 'Approve' | 'Review' | 'Reject') => {
    switch (decision) {
      case 'Approve':
        return t.results.decision.approve
      case 'Review':
        return t.results.decision.review
      case 'Reject':
        return t.results.decision.reject
    }
  }

  // Show toast on successful submission
  useEffect(() => {
    if (state.data && !state.isLoading) {
      const { decision, confidence } = state.data
      const confidencePercent = Math.round(confidence * 100)

      const decisionLabel = getDecisionLabel(decision)
      const description = format('toast.analysisDesc', {
        decision: decisionLabel,
        confidence: confidencePercent,
      })

      if (decision === 'Approve') {
        toast({
          title: t.toast.approved,
          description,
          action: (
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          ),
        })
      } else if (decision === 'Reject') {
        toast({
          variant: 'destructive',
          title: t.toast.rejected,
          description,
          action: (
            <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          ),
        })
      } else {
        toast({
          title: t.toast.review,
          description,
          action: (
            <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          ),
        })
      }
    }
  }, [state.data, state.isLoading, toast, t, format])

  // Show toast on error
  useEffect(() => {
    if (state.error && !state.isLoading) {
      toast({
        variant: 'destructive',
        title: t.toast.submissionFailed,
        description: state.error,
        action: (
          <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
        ),
      })
    }
  }, [state.error, state.isLoading, toast, t])

  const handleSubmit = async (data: Parameters<typeof submit>[0]) => {
    const result = await submit(data, false) // Use real n8n webhook

    // Add to history on successful submission
    if (result && data.imageFile) {
      try {
        const imageData = await fileToBase64(data.imageFile)
        addToHistory(
          {
            title: data.title,
            description: data.description,
            price: data.price,
            category: data.category,
            imageData,
          },
          result
        )
      } catch {
        // If image conversion fails, save without image
        addToHistory(
          {
            title: data.title,
            description: data.description,
            price: data.price,
            category: data.category,
          },
          result
        )
      }
    } else if (result) {
      addToHistory(
        {
          title: data.title,
          description: data.description,
          price: data.price,
          category: data.category,
        },
        result
      )
    }

    return result
  }

  const handleNewSubmission = () => {
    reset()
    setViewMode('form')
  }

  const handleViewHistory = () => {
    setViewMode('history')
  }

  const handleBackToForm = () => {
    setViewMode('form')
  }

  const handleViewHistoryItem = (item: AdHistoryItem) => {
    setSelectedHistoryItem(item)
  }

  const handleCloseHistoryDetail = () => {
    setSelectedHistoryItem(null)
  }

  const handleDeleteHistoryItem = (id: string) => {
    removeFromHistory(id)
    toast({
      title: t.history.deleted,
      description: t.history.deletedDesc,
    })
  }

  const handleClearHistory = () => {
    if (confirm(t.history.clearAllConfirm)) {
      clearHistory()
      toast({
        title: t.history.cleared,
        description: t.history.clearedDesc,
      })
    }
  }

  // Memoize info box steps
  const infoBoxSteps = useMemo(() => t.form.infoBox.steps, [t.form.infoBox.steps])

  return (
    <Layout>
      <div className="mx-auto max-w-4xl">
        {/* Header with view toggle */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-card-foreground mb-2">
              {viewMode === 'form' ? t.view.form.title : t.view.history.title}
            </h2>
            <p className="text-muted-foreground">
              {viewMode === 'form'
                ? t.view.form.subtitle
                : format('view.history.subtitle', {
                    count: history.length,
                    submission: history.length === 1
                      ? t.view.history.subtitleSingular
                      : t.view.history.subtitlePlural,
                  })}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={viewMode === 'form' ? handleViewHistory : handleBackToForm}
            className="gap-2"
          >
            {viewMode === 'form' ? (
              <>
                <History className="h-4 w-4" />
                {format('view.history.viewHistory', { count: history.length })}
              </>
            ) : (
              t.view.history.backToForm
            )}
          </Button>
        </div>

        {/* Show form or history based on view mode */}
        {viewMode === 'form' ? (
          <>
            {/* Show form or results based on state */}
            {state.data ? (
              <ResultsDisplay data={state.data} onNewSubmission={handleNewSubmission} />
            ) : (
              <>
                {/* Form */}
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                  <AdSubmissionForm onSubmit={handleSubmit} isLoading={state.isLoading} />
                </div>

                {/* Error Display */}
                {state.error && (
                  <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-destructive" />
                      <div>
                        <h4 className="font-semibold text-destructive">{t.common.error}</h4>
                        <p className="text-sm text-destructive/80">{state.error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info Box */}
                <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4">
                  <h3 className="font-semibold text-foreground mb-2">{t.form.infoBox.title}</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    {infoBoxSteps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                  <p className="text-xs text-muted-foreground mt-3 italic">
                    {t.form.infoBox.note}
                  </p>
                </div>
              </>
            )}
          </>
        ) : (
          /* History View */
          <HistoryList
            history={history}
            filter={historyFilter}
            onFilterChange={setHistoryFilter}
            onDelete={handleDeleteHistoryItem}
            onView={handleViewHistoryItem}
            onClearAll={handleClearHistory}
            onExport={exportHistory}
          />
        )}

        {/* History Detail Modal */}
        <HistoryDetail
          item={selectedHistoryItem}
          isOpen={selectedHistoryItem !== null}
          onClose={handleCloseHistoryDetail}
        />
      </div>
    </Layout>
  )
}

function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <RTLProvider>
          <AppContent />
          <Toaster />
        </RTLProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}

export default App
