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
    // Signatures inherited from next-intl so option types stay in sync.
    date: (...args: Parameters<typeof format.dateTime>) =>
      format.dateTime(...args),
    number: (...args: Parameters<typeof format.number>) =>
      format.number(...args),
    relativeTime: (...args: Parameters<typeof format.relativeTime>) =>
      format.relativeTime(...args),
    currency: (value: number, currency: string = DEFAULT_CURRENCY) =>
      formatCurrency(value, currency, locale),
    currencyShort: (value: number, currency: string = DEFAULT_CURRENCY) =>
      formatCurrencyShort(value, currency),
  };
}
