import { createContext, useContext, type ReactNode } from 'react'
import { useI18n } from '../i18n'

type Direction = 'ltr' | 'rtl'

interface RTLContextType {
  direction: Direction
  isRTL: boolean
}

const RTLContext = createContext<RTLContextType | undefined>(undefined)

/**
 * RTLProvider - Now syncs with I18nProvider for language/direction
 * This is kept for backward compatibility but delegates to i18n context
 */
export function RTLProvider({ children }: { children: ReactNode }) {
  const { direction, isRTL } = useI18n()

  return (
    <RTLContext.Provider value={{ direction, isRTL }}>
      {children}
    </RTLContext.Provider>
  )
}

/**
 * useRTL - Hook to get RTL state
 * @deprecated Use useI18n() instead for both language and direction
 */
export function useRTL() {
  const context = useContext(RTLContext)
  if (!context) {
    throw new Error('useRTL must be used within RTLProvider (which requires I18nProvider)')
  }
  return context
}
