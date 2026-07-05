"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Languages } from "lucide-react";

import { setUserLocale } from "@/i18n/locale";
import { locales, LOCALE_LABELS, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Language picker — switches the interface locale.
 *
 * Persists the choice via the `setUserLocale` server action (writes a
 * cookie + revalidates the layout), so server-rendered strings pick up
 * the new locale on the next render. `useTransition` keeps the UI
 * responsive and disables the buttons while the switch is in flight.
 */
export function LanguageSwitcher() {
  const t = useTranslations("settings.appearance");
  const activeLocale = useLocale();
  const [isPending, startTransition] = useTransition();

  function onPick(locale: Locale) {
    if (locale === activeLocale) return;
    startTransition(() => {
      setUserLocale(locale);
    });
  }

  return (
    <div
      role="radiogroup"
      aria-label={t("languageAria")}
      className="grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2"
    >
      {locales.map((locale) => {
        const isActive = locale === activeLocale;
        return (
          <button
            key={locale}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={isPending}
            onClick={() => onPick(locale)}
            className={cn(
              "flex items-center gap-3 rounded-lg border bg-card p-4 text-left transition-colors disabled:opacity-60",
              isActive
                ? "border-primary/60 ring-2 ring-primary/40"
                : "border-border hover:border-border hover:bg-muted/40",
            )}
          >
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground"
            >
              <Languages className="h-4 w-4" />
            </span>
            <span className="flex-1 text-sm font-semibold text-foreground">
              {LOCALE_LABELS[locale]}
            </span>
            {isActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                <Check className="h-3 w-3" />
                {t("active")}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
