"use client"

"use client"

import { Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ResponseTimeSummary } from '@/lib/dashboard/types'
import { useFormat } from '@/i18n/use-format'
import { BarChart } from '@/components/tremor/bar-chart'
import { EmptyState } from './empty-state'
import { Skeleton } from './skeleton'

interface ResponseTimeChartProps {
  data: ResponseTimeSummary | null
  loading: boolean
  /** Minutes. Surfaced as a "target" pill in the header. The
   *  hand-rolled SVG version drew this as a horizontal dashed
   *  line on the chart; Tremor BarChart doesn't expose Recharts
   *  primitives, so we promote it to the header for now. A
   *  follow-up can introduce an overlay or extend the vendored
   *  BarChart with a `referenceLines` prop. */
  thresholdMinutes?: number
}

// Reference week starting on a Monday (2024-01-01 is a Monday), used
// to derive locale-aware short weekday names in Monday-first order.
const MONDAY_FIRST_REF = Array.from(
  { length: 7 },
  (_, i) => new Date(2024, 0, 1 + i),
)

export function ResponseTimeChart({
  data,
  loading,
  thresholdMinutes = 5,
}: ResponseTimeChartProps) {
  const t = useTranslations('dashboard')
  const fmt = useFormat()
  const hasData = data?.buckets.some((b) => b.avgMinutes != null) ?? false

  // Single category, single colour — the data is "average minutes
  // per weekday". Tremor expects categories as the second tuple in
  // the row object, so we shape the buckets into
  // `{ day: 'Mon', '<label>': 4.2 }` rows below.
  const category = t('responseTime.category')

  // Locale-aware short weekday names, Monday first.
  const weekdays = MONDAY_FIRST_REF.map((d) => fmt.date(d, { weekday: 'short' }))

  const formatMinutes = (mins: number | null): string => {
    if (mins == null) return '—'
    if (mins < 1)
      return t('responseTime.units.seconds', {
        value: Math.max(1, Math.round(mins * 60)),
      })
    if (mins < 60)
      return t('responseTime.units.minutes', {
        value: fmt.number(mins, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      })
    return t('responseTime.units.hours', {
      value: fmt.number(mins / 60, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    })
  }

  // Map buckets → Tremor rows. Null `avgMinutes` (no samples)
  // collapses to 0; the chart will render an empty slot for it.
  // We attach `samples` on the row so a future customTooltip can
  // surface "no samples" copy without losing the data shape.
  const chartData =
    data?.buckets.map((b, i) => ({
      day: weekdays[i],
      [category]: b.avgMinutes ?? 0,
      samples: b.samples,
    })) ?? []

  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {t('responseTime.title')}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('responseTime.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3 text-right text-xs">
          {thresholdMinutes > 0 && (
            <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 font-medium text-rose-300 tabular-nums">
              {t('responseTime.target', { minutes: thresholdMinutes })}
            </span>
          )}
          {data && (data.thisWeekAvg != null || data.lastWeekAvg != null) && (
            <div>
              <div className="text-muted-foreground">
                {t('responseTime.thisWeek')}{' '}
                <span className="font-medium text-foreground tabular-nums">
                  {formatMinutes(data.thisWeekAvg)}
                </span>
              </div>
              <div className="text-muted-foreground">
                {t('responseTime.lastWeek')}{' '}
                <span className="tabular-nums">{formatMinutes(data.lastWeekAvg)}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="p-5">
        {loading || !data ? (
          <Skeleton className="h-[260px] w-full" />
        ) : !hasData ? (
          <EmptyState
            icon={Clock}
            title={t('responseTime.emptyTitle')}
            hint={t('responseTime.emptyHint')}
          />
        ) : (
          <BarChart
            data={chartData}
            index="day"
            categories={[category]}
            // 'violet' maps to Tailwind's `fill-violet-500` — matches
            // the brand accent the hand-rolled bars used (#7c3aed).
            colors={['violet']}
            valueFormatter={(value) =>
              t('responseTime.units.minutes', {
                value: fmt.number(value, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                }),
              })
            }
            showLegend={false}
            yAxisWidth={48}
            // Compact height so the chart sits well inside the card
            // without dominating the row alongside the donut + activity feed.
            className="h-[260px]"
          />
        )}
      </div>
    </section>
  )
}
