import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import type { LanguageCode, Translations } from './types';
import { en, ru, zh } from './locales';

const TRANSLATIONS: Record<LanguageCode, Translations> = {
  en,
  ru,
  zh,
};

type TranslationsContextValue = {
  lang: LanguageCode;
  setLang: (code: LanguageCode) => void;
  t: Translations;
};

const TranslationsContext = createContext<TranslationsContextValue | undefined>(undefined);

export function TranslationsProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<LanguageCode>(() => (localStorage.getItem('lang') as LanguageCode) || 'en');

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const t = useMemo(() => TRANSLATIONS[lang], [lang]);

  const value = useMemo<TranslationsContextValue>(() => ({ lang, setLang, t }), [lang, t]);

  return <TranslationsContext.Provider value={value}>{children}</TranslationsContext.Provider>;
}

export function useLang(): TranslationsContextValue {
  const ctx = useContext(TranslationsContext);
  if (!ctx) throw new Error('useLang must be used within TranslationsProvider');
  return ctx;
}

export function useTranslations(): Translations {
  return useLang().t;
}

// Helper function to translate backend error messages
export function useErrorTranslator() {
  const { t } = useLang();
  
  return (backendMessage: string): string => {
    // Map common backend error patterns to translation keys
    const lowerMessage = backendMessage.toLowerCase();
    
    if (lowerMessage.includes('username') && lowerMessage.includes('3 characters')) {
      return t.auth.errors.usernameMinLength;
    }
    if (lowerMessage.includes('password') && lowerMessage.includes('6 characters')) {
      return t.auth.errors.passwordMinLength;
    }
    if (lowerMessage.includes('email') && lowerMessage.includes('valid')) {
      return t.auth.errors.emailInvalid;
    }
    if (lowerMessage.includes('invalid') && (lowerMessage.includes('credentials') || lowerMessage.includes('password'))) {
      return t.auth.errors.invalidCredentials;
    }
    if (lowerMessage.includes('user not found')) {
      return t.auth.errors.userNotFound;
    }
    if (lowerMessage.includes('email') && (lowerMessage.includes('taken') || lowerMessage.includes('exists'))) {
      return t.auth.errors.emailTaken;
    }
    if (lowerMessage.includes('username') && (lowerMessage.includes('taken') || lowerMessage.includes('exists'))) {
      return t.auth.errors.usernameTaken;
    }
    
    // Fallback to original message if no pattern matches
    return backendMessage;
  };
}

// Re-export types for convenience
export type { LanguageCode, Translations } from './types';
