import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { en } from './en'
import { ar } from './ar'

// Translation types
export type Translations = typeof en
export type Language = 'en' | 'ar'
export type Direction = 'ltr' | 'rtl'

// All translations
export const translations = {
  en,
  ar,
} as const

// Language metadata
export const languages = {
  en: {
    name: en.language.name,
    code: en.language.code,
    direction: en.language.direction as Direction,
  },
  ar: {
    name: ar.language.name,
    code: ar.language.code,
    direction: ar.language.direction as Direction,
  },
} as const

// Context type
interface I18nContextType {
  language: Language
  direction: Direction
  setLanguage: (language: Language) => void
  t: Translations
  format: (key: string, params: Record<string, string | number>) => string
  isRTL: boolean
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

// Provider props
interface I18nProviderProps {
  children: ReactNode
  defaultLanguage?: Language
}

// Helper function to format translation with parameters
function formatTemplate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key]?.toString() ?? `{${key}}`
  })
}

// Helper to get nested value by dot-notation path
function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return path // Return the key path if not found
    }
  }
  return typeof current === 'string' ? current : String(current)
}

// I18n Provider
export function I18nProvider({ children, defaultLanguage = 'en' }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('language') as Language
    return (stored && (stored === 'en' || stored === 'ar')) ? stored : defaultLanguage
  })

  const direction = languages[language].direction

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('dir', direction)
    root.setAttribute('lang', language)
    localStorage.setItem('language', language)
    localStorage.setItem('direction', direction)
  }, [language, direction])

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
  }

  const format = (
    key: string,
    params: Record<string, string | number>
  ): string => {
    const value = getNestedValue(translations[language], key)
    if (typeof value === 'string' && value.includes('{')) {
      return formatTemplate(value, params)
    }
    return value
  }

  const value: I18nContextType = {
    language,
    direction,
    setLanguage,
    t: translations[language] as Translations,
    format,
    isRTL: direction === 'rtl',
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// Hook to use i18n
export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}
