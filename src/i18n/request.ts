import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, isLocale, NAMESPACES } from './config'

// Runs on every request that renders a Server Component tree.
// Resolves the active locale from the `locale` cookie (falling back
// to the default) and assembles the message catalogue by merging one
// JSON file per namespace (messages/<locale>/<namespace>.json), so
// modules can be translated in separate files without merge conflicts.
export default getRequestConfig(async () => {
  const store = await cookies()
  const cookieValue = store.get('locale')?.value
  const locale =
    cookieValue && isLocale(cookieValue) ? cookieValue : defaultLocale

  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => {
      const mod = await import(`../../messages/${locale}/${ns}.json`)
      return [ns, mod.default] as const
    })
  )

  return { locale, messages: Object.fromEntries(entries) }
})
