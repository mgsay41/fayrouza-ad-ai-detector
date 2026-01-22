import { useState, useEffect, useCallback } from 'react'
import type { AdHistoryItem, AdSubmissionFormData, AIResponse } from '../types'

const HISTORY_STORAGE_KEY = 'ad-moderation-history'
const MAX_HISTORY_ITEMS = 50

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
}

export function useAdHistory(): UseAdHistoryReturn {
  const [history, setHistory] = useState<AdHistoryItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Validate and parse dates
        const items: AdHistoryItem[] = parsed.map((item: AdHistoryItem) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }))
        setHistory(items)
      }
    } catch (error) {
      console.error('Failed to load history from localStorage:', error)
    } finally {
      setIsInitialized(true)
    }
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
      } catch (error) {
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
        // Keep only the last MAX_HISTORY_ITEMS items
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
  }
}
