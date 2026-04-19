import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import commonEs from '@/locales/es/common.json'
import authEs from '@/locales/es/auth.json'
import expensesEs from '@/locales/es/expenses.json'
import contributorsEs from '@/locales/es/contributors.json'
import contributionsEs from '@/locales/es/contributions.json'
import categoriesEs from '@/locales/es/categories.json'
import expenseCategoriesEs from '@/locales/es/expense-categories.json'
import reportsEs from '@/locales/es/reports.json'
import housesEs from '@/locales/es/houses.json'

import commonEn from '@/locales/en/common.json'
import authEn from '@/locales/en/auth.json'
import expensesEn from '@/locales/en/expenses.json'
import contributorsEn from '@/locales/en/contributors.json'
import contributionsEn from '@/locales/en/contributions.json'
import categoriesEn from '@/locales/en/categories.json'
import expenseCategoriesEn from '@/locales/en/expense-categories.json'
import reportsEn from '@/locales/en/reports.json'
import housesEn from '@/locales/en/houses.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: {
        common: commonEs,
        auth: authEs,
        expenses: expensesEs,
        contributors: contributorsEs,
        contributions: contributionsEs,
        categories: categoriesEs,
        'expense-categories': expenseCategoriesEs,
        reports: reportsEs,
        houses: housesEs,
      },
      en: {
        common: commonEn,
        auth: authEn,
        expenses: expensesEn,
        contributors: contributorsEn,
        contributions: contributionsEn,
        categories: categoriesEn,
        'expense-categories': expenseCategoriesEn,
        reports: reportsEn,
        houses: housesEn,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'expenses', 'contributors', 'contributions', 'categories', 'expense-categories', 'reports', 'houses'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18n_language',
      caches: ['localStorage'],
    },
  })

export default i18n
