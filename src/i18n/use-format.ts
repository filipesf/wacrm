"use client";

import { useFormatter, useLocale } from "next-intl";
import {
  DEFAULT_CURRENCY,
  formatCurrency,
  formatCurrencyShort,
} from "@/lib/currency";

/**
 * Locale-aware formatting for Client Components.
 *
 * Dates and numbers go through next-intl's `useFormatter` (backed by
 * `Intl`), so they follow the active locale automatically. Currency
 * reuses the existing currency helpers but binds them to the active
 * locale; the ISO code is passed explicitly by the caller (deals /
 * account carry it) to avoid coupling this hook to auth context.
 *
 * Replaces scattered `toLocaleDateString(undefined, …)` /
 * `Intl.NumberFormat(undefined, …)` calls that silently used the
 * runtime locale instead of the user's chosen one.
 */
export function useFormat() {
  const format = useFormatter();
  const locale = useLocale();

  return {
    // Accept an `Intl` options object directly — the form used across
    // the app (e.g. `fmt.date(d, { dateStyle: 'medium' })`). next-intl's
    // `dateTime`/`number` are overloaded; spreading `Parameters<…>` picks
    // the trailing string-format overload, which rejects the options
    // object, so we type these explicitly instead.
    date: (
      value: Date | number,
      options?: Parameters<typeof format.dateTime>[2],
    ) => format.dateTime(value, options),
    number: (
      value: number | bigint,
      options?: Parameters<typeof format.number>[2],
    ) => format.number(value, options),
    relativeTime: (...args: Parameters<typeof format.relativeTime>) =>
      format.relativeTime(...args),
    currency: (value: number, currency: string = DEFAULT_CURRENCY) =>
      formatCurrency(value, currency, locale),
    currencyShort: (value: number, currency: string = DEFAULT_CURRENCY) =>
      formatCurrencyShort(value, currency),
  };
}
