import { createContext, useContext, useState, useCallback } from 'react'

const STORAGE_KEY = 'rcf_language'

const DICTIONARIES = {
  en: {
    settings: 'Settings',
    editProfile: 'Edit Profile',
    notificationPreferences: 'Notification Preferences',
    privacySecurity: 'Privacy & Security',
    language: 'Language',
    helpSupport: 'Help & Support',
    replayTutorial: 'Replay Tutorial',
    about: 'About',
  },
  fr: {
    settings: 'Paramètres',
    editProfile: 'Modifier le profil',
    notificationPreferences: 'Préférences de notification',
    privacySecurity: 'Confidentialité et sécurité',
    language: 'Langue',
    helpSupport: 'Aide et support',
    replayTutorial: 'Revoir le tutoriel',
    about: 'À propos',
  },
}

export const AVAILABLE_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
]

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'en'
    } catch {
      return 'en'
    }
  })

  const setLanguage = useCallback((code) => {
    setLanguageState(code)
    try {
      localStorage.setItem(STORAGE_KEY, code)
    } catch {
      // ignore
    }
  }, [])

  const t = useCallback(
    (key) => DICTIONARIES[language]?.[key] || DICTIONARIES.en[key] || key,
    [language]
  )

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}