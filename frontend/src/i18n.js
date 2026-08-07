import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import esTranslations from './locales/es.json';
import enTranslations from './locales/en.json';
import ptTranslations from './locales/pt.json';

const savedLanguage = localStorage.getItem('user_language') || 'es';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: esTranslations },
      en: { translation: enTranslations },
      pt: { translation: ptTranslations }
    },
    lng: savedLanguage,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false // React already escapes XSS
    }
  });

export default i18n;
