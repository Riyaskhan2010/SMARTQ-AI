import { createContext, useContext, useState, useEffect } from 'react';
import { getTranslation, LANGUAGES } from '../i18n/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('smartq_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('smartq_lang', lang);
    const dir = LANGUAGES.find(l => l.code === lang)?.dir || 'ltr';
    document.documentElement.dir  = dir;
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key) => getTranslation(lang, key);
  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, currentLang, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
};
