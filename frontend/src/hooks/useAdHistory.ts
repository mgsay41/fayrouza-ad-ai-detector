import { useState, useEffect, useCallback } from 'react'
import { z } from 'zod'
import type { AdHistoryItem, AdSubmissionFormData, AIResponse } from '../types'

const HISTORY_STORAGE_KEY = 'ad-moderation-history'
const MAX_HISTORY_ITEMS = 50

const adHistoryItemSchema = z.object({
  id: z.string(),
  adData: z.object({
    title: z.string(),
    description: z.string(),
    price: z.number(),
    category: z.string(),
    imageData: z.string().optional(),
  }),
  decision: z.enum(['Approve', 'Review', 'Reject']),
  confidence: z.number(),
  reasoning: z.string(),
  violations: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  rawResponse: z.unknown().optional(),
  responseTime: z.number().optional(),
  timestamp: z.string().or(z.date()),
})

const adHistoryArraySchema = z.array(adHistoryItemSchema)

interface UseAdHistoryReturn {
  history: AdHistoryItem[]
  addToHistory: (
    adData: AdSubmissionFormData & { imageData?: string },
    response: AIResponse
  ) => void
  removeFromHistory: (id: string) => void
  clearHistory: () => void
  getHistoryItem: (id: string) => AdHistoryItem | undefined
  exportHistory: () => void
  importHistory: (data: AdHistoryItem[]) => void
  storageError: string | null
}

export function useAdHistory(): UseAdHistoryReturn {
  const [history, setHistory] = useState<AdHistoryItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [storageError, setStorageError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const validated = adHistoryArraySchema.safeParse(parsed)
        if (validated.success) {
          const items: AdHistoryItem[] = validated.data.map((item) => ({
            ...item,
            adData: {
              ...item.adData,
              category: item.adData.category as AdHistoryItem['adData']['category'],
            },
            timestamp: new Date(item.timestamp),
          }))
          setHistory(items)
        } else {
          console.error('Invalid history data in localStorage:', validated.error)
          localStorage.removeItem(HISTORY_STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error('Failed to load history from localStorage:', error)
    } finally {
      setIsInitialized(true)
    }
  }, [])

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
        setStorageError(null)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          setStorageError('QuotaExceeded')
        }
        console.error('Failed to save history to localStorage:', error)
      }
    }
  }, [history, isInitialized])

  const addToHistory = useCallback(
    (
      adData: AdSubmissionFormData & { imageData?: string },
      response: AIResponse
    ) => {
      const newItem: AdHistoryItem = {
        id: crypto.randomUUID(),
        adData: {
          title: adData.title,
          description: adData.description,
          price: adData.price,
          category: adData.category,
          imageData: adData.imageData,
        },
        decision: response.decision,
        confidence: response.confidence,
        reasoning: response.reasoning,
        violations: response.violations,
        recommendations: response.recommendations,
        rawResponse: response.rawResponse,
        responseTime: response.responseTime,
        timestamp: response.timestamp,
      }

      setHistory((prev) => {
        const updated = [newItem, ...prev]
        return updated.slice(0, MAX_HISTORY_ITEMS)
      })
    },
    []
  )

  const removeFromHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const getHistoryItem = useCallback(
    (id: string): AdHistoryItem | undefined => {
      return history.find((item) => item.id === id)
    },
    [history]
  )

  const exportHistory = useCallback(() => {
    const blob = new Blob([JSON.stringify(history, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ad-history-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [history])

  const importHistory = useCallback((data: AdHistoryItem[]) => {
    try {
      const items: AdHistoryItem[] = data.map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }))
      setHistory(items.slice(0, MAX_HISTORY_ITEMS))
    } catch (error) {
      console.error('Failed to import history:', error)
      throw new Error('Invalid history data format')
    }
  }, [])

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getHistoryItem,
    exportHistory,
    importHistory,
    storageError,
  }
}
