'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import {
  LOCALE_COOKIE,
  defaultLocale,
  isLocale,
  type Locale,
} from './config'

// Server actions for reading/writing the locale cookie. next-intl
// picks the value up on the next render via src/i18n/request.ts.

export async function getUserLocale(): Promise<Locale> {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value
  return value && isLocale(value) ? value : defaultLocale
}

export async function setUserLocale(locale: Locale): Promise<void> {
  const store = await cookies()
  store.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  })
  // Re-render every route so server-rendered strings pick up the
  // new locale immediately.
  revalidatePath('/', 'layout')
}
