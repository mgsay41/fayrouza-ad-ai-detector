import { Download } from 'lucide-react'
import { Button } from '../ui/button'
import type { AdHistoryItem } from '../../types'

interface ExportButtonProps {
  history: AdHistoryItem[]
  filename?: string
}

export function ExportButton({
  history,
  filename = `ad-history-${new Date().toISOString().split('T')[0]}.json`,
}: ExportButtonProps) {
  const handleExport = () => {
    const exportData = history.map((item) => ({
      id: item.id,
      timestamp: item.timestamp.toISOString(),
      adData: {
        title: item.adData.title,
        description: item.adData.description,
        price: item.adData.price,
        category: item.adData.category,
        hasImage: !!item.adData.imageData,
      },
      decision: item.decision,
      confidence: item.confidence,
      reasoning: item.reasoning,
      violations: item.violations,
      recommendations: item.recommendations,
      responseTime: item.responseTime,
    }))

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={history.length === 0}>
      <Download className="h-4 w-4 mr-2" />
      Export JSON
    </Button>
  )
}
