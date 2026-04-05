// src/hooks/useTranslation.js
import { useLanguage } from '../context/LanguageContext';

// Import translation files
import enTranslations from '../locales/en.json';
import zhTranslations from '../locales/zh.json';

const translations = {
  en: enTranslations,
  zh: zhTranslations
};

export const useTranslation = () => {
  const { language } = useLanguage();
  
  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key; // Fallback to key if translation not found
  };
  
  return { t, language };
};