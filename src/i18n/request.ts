import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, isLocale } from './config'

// Runs on every request that renders a Server Component tree.
// Resolves the active locale from the `locale` cookie (falling back
// to the default) and loads the matching message catalogue.
export default getRequestConfig(async () => {
  const store = await cookies()
  const cookieValue = store.get('locale')?.value
  const locale =
    cookieValue && isLocale(cookieValue) ? cookieValue : defaultLocale

  const messages = (await import(`../../messages/${locale}.json`)).default

  return { locale, messages }
})
