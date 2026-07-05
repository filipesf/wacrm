// Central i18n configuration.
//
// wacrm uses next-intl WITHOUT locale-prefixed routing: the active
// locale lives in a cookie, not in the URL. This keeps the whole
// route tree (and the Supabase-session middleware) untouched — see
// src/i18n/request.ts for how the cookie is read on each request.
//
// To add a language: add its tag to `locales`, drop a matching
// `messages/<tag>.json`, and add a label in LOCALE_LABELS below.
// Nothing else needs to change.

export const locales = ['pt-BR', 'en'] as const

export type Locale = (typeof locales)[number]

// Locale used when the visitor has no `locale` cookie yet.
export const defaultLocale: Locale = 'pt-BR'

// Name of the cookie that persists the visitor's choice.
export const LOCALE_COOKIE = 'locale'

// Human-readable names shown in the language switcher.
export const LOCALE_LABELS: Record<Locale, string> = {
  'pt-BR': 'Português (Brasil)',
  en: 'English',
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}
