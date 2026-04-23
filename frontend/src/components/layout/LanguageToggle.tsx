import { Globe } from 'lucide-react'
import { useI18n, languages } from '../../i18n'

export function LanguageToggle() {
  const { language, setLanguage } = useI18n()

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en')
  }

  const currentLang = languages[language]
  const otherLang = languages[language === 'en' ? 'ar' : 'en']
  const label = otherLang.name

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="inline-flex items-center justify-center gap-2 rounded-md bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      aria-label={label}
      title={label}
    >
      <Globe className="h-4 w-4" />
      <span>{currentLang.code.toUpperCase()}</span>
    </button>
  )
}
