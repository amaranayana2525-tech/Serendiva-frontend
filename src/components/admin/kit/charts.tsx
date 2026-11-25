'use client'

import NextLink from 'next/link'
import { useId, useState, type ReactNode } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

export interface ChartDatum {
  /** Short axis label ("Oct"). */
  label: string
  value: number
  /** Long label for tooltips / the data table ("October 2026"). */
  fullLabel?: string
  /** Optional link (bar lists): e.g. inquiries filtered by that tour. */
  href?: string
}

/** Rounds the axis maximum up to a clean number (1, 2, 5 × 10ⁿ steps) and returns 4 ticks. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1]
  const rawStep = max / count
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep) ?? rawStep
  const niceStep = Number.isInteger(max) && step < 1 ? 1 : step
  const ticks: number[] = []
  for (let v = 0; v <= max + niceStep * 0.999; v += niceStep) ticks.push(Math.round(v * 1000) / 1000)
  return ticks
}

export interface BarChartProps {
  data: readonly ChartDatum[]
  /** Accessible title of the chart (also used as the data-table caption). */
  title: string
  /** Name of the measured value ("Inquiries") for tooltips and the table header. */
  valueLabel: string
  /** Header of the label column in the data table ("Month"). */
  categoryLabel: string
  /** Plot height in px (default 200). */
  height?: number
  /** Index to emphasise (e.g. the current month) — gets a bold axis label. */
  highlightIndex?: number
  className?: string
}

/**
 * Single-series column chart (pure HTML/CSS): ≤ 24 px columns with 4 px rounded caps on one baseline, hairline grid
 * with clean ticks, hover/focus tooltip per column, the maximum labelled on its cap, and a screen-reader data table.
 */
export function BarChart({
  data,
  title,
  valueLabel,
  categoryLabel,
  height = 200,
  highlightIndex,
  className,
}: BarChartProps) {
  const format = useFormatter()
  const t = useTranslations('admin.kit.charts')
  const tableId = useId()
  const [active, setActive] = useState<number | null>(null)
  const max = Math.max(0, ...data.map((d) => d.value))
  const ticks = niceTicks(max)
  const top = ticks[ticks.length - 1] || 1
  const maxIndex = max > 0 ? data.findIndex((d) => d.value === max) : -1
  const n = (v: number) => format.number(v)

  return (
    <figure className={cn('flex flex-col gap-2', className)}>
      <div className="flex gap-2" aria-hidden="true">
        {/* y axis */}
        <div className="relative w-7 shrink-0" style={{ height }}>
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 translate-y-1/2 font-caption text-[11px] tabular-nums text-on-surface-variant"
              style={{ bottom: `${(tick / top) * 100}%` }}
            >
              {n(tick)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          {/* grid */}
          <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height }}>
            {ticks.map((tick) => (
              <span
                key={tick}
                className={cn('absolute inset-x-0 h-px', tick === 0 ? 'bg-outline-variant' : 'bg-surface-container-high')}
                style={{ bottom: `${(tick / top) * 100}%` }}
              />
            ))}
          </div>
          {/* columns */}
          <div className="relative flex items-end gap-[2px]" style={{ height }} onMouseLeave={() => setActive(null)}>
            {data.map((d, i) => {
              const pct = (d.value / top) * 100
              const showTip = active === i
              return (
                <div
                  key={`${d.label}-${i}`}
                  className="relative flex h-full flex-1 items-end justify-center"
                  onMouseEnter={() => setActive(i)}
                >
                  {(showTip || (i === maxIndex && active === null)) && (
                    <span
                      className={cn(
                        'pointer-events-none absolute z-10 -translate-y-full whitespace-nowrap font-caption text-[11px] tabular-nums',
                        showTip
                          ? 'shadow-ambient rounded-md border border-surface-container bg-surface-container-lowest px-2 py-1 text-on-surface'
                          : 'pb-0.5 font-semibold text-on-surface',
                      )}
                      style={{ bottom: `${pct}%` }}
                    >
                      {showTip ? `${d.fullLabel ?? d.label}: ${n(d.value)}` : n(d.value)}
                    </span>
                  )}
                  <span
                    className={cn(
                      'block w-full max-w-6 rounded-t transition-colors',
                      d.value > 0 ? 'min-h-[3px]' : '',
                      showTip ? 'bg-primary-container' : 'bg-primary',
                    )}
                    style={{ height: `${pct}%` }}
                  />
                </div>
              )
            })}
          </div>
          {/* x labels */}
          <div className="mt-1.5 flex gap-[2px]">
            {data.map((d, i) => (
              <span
                key={`${d.label}-${i}`}
                className={cn(
                  'flex-1 truncate text-center font-caption text-[11px] text-on-surface-variant',
                  i === highlightIndex && 'font-semibold text-on-surface',
                  // Keep every other label on phones when there are many columns.
                  data.length > 8 && i % 2 === 1 && 'max-sm:invisible',
                )}
              >
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="sr-only">
        {t('summary', { title, count: data.length, max: n(max) })}
      </figcaption>
      <table id={tableId} className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">{categoryLabel}</th>
            <th scope="col">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={`${d.label}-${i}`}>
              <th scope="row">{d.fullLabel ?? d.label}</th>
              <td>{n(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

export interface BarListProps {
  data: readonly ChartDatum[]
  /** Accessible name of the list. */
  title: string
  /** Max rows (rest summed into "Other"). */
  limit?: number
  /** Show "12%" share next to the value. */
  showShare?: boolean
  /** Shown when data is empty. */
  empty?: ReactNode
  className?: string
}

/**
 * Ranked horizontal bars (top countries, tours, sources): label + value text on one line, a thin bar below scaled to
 * the maximum. Rows with `href` are links. Values are real text (accessible without the bars).
 */
export function BarList({ data, title, limit, showShare = false, empty, className }: BarListProps) {
  const format = useFormatter()
  const t = useTranslations('admin.kit.charts')
  const sorted = [...data].sort((a, b) => b.value - a.value)
  let rows = sorted
  if (limit !== undefined && sorted.length > limit) {
    const rest = sorted.slice(limit - 1).reduce((s, d) => s + d.value, 0)
    rows = [...sorted.slice(0, limit - 1), { label: t('other'), value: rest }]
  }
  const total = data.reduce((s, d) => s + d.value, 0)
  const max = Math.max(1, ...rows.map((d) => d.value))
  if (rows.length === 0) {
    return <p className="py-6 text-center font-body-md text-body-md text-on-surface-variant">{empty ?? t('noData')}</p>
  }
  return (
    <ul aria-label={title} className={cn('flex flex-col gap-2.5', className)}>
      {rows.map((d, i) => {
        const share = total ? Math.round((d.value / total) * 100) : 0
        const body = (
          <>
            <span className="flex items-baseline justify-between gap-3">
              <span className="truncate font-body-md text-body-md text-on-surface">{d.fullLabel ?? d.label}</span>
              <span className="shrink-0 font-body-md text-body-md font-semibold tabular-nums text-on-surface">
                {format.number(d.value)}
                {showShare && <span className="ml-1.5 font-normal text-on-surface-variant">{share}%</span>}
              </span>
            </span>
            <span className="mt-1 block h-1.5 w-full rounded-full bg-surface-container" aria-hidden="true">
              <span
                className="block h-full rounded-full bg-primary-container"
                style={{ width: `${Math.max(2, (d.value / max) * 100)}%` }}
              />
            </span>
          </>
        )
        return (
          <li key={`${d.label}-${i}`}>
            {d.href ? (
              <NextLink
                href={d.href}
                className="-mx-1.5 block rounded-md px-1.5 py-1 hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {body}
              </NextLink>
            ) : (
              <div className="py-1">{body}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export interface StatCardProps {
  label: string
  value: ReactNode
  icon?: string
  /** Small line under the value ("of 42 total", "since Monday"). */
  hint?: ReactNode
  /** Makes the whole card a link. */
  href?: string
  /** 'attention' = cinnamon icon chip (new leads waiting). */
  tone?: 'default' | 'attention' | 'positive'
  className?: string
}

/** KPI tile: label, big tabular value, icon, hint; optional link. */
export function StatCard({ label, value, icon, hint, href, tone = 'default', className }: StatCardProps) {
  const content = (
    <>
      <span className="flex items-start justify-between gap-2">
        <span className="font-body-md text-[13px] font-medium text-on-surface-variant">{label}</span>
        {icon && (
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              tone === 'attention'
                ? 'bg-secondary-fixed text-secondary'
                : tone === 'positive'
                  ? 'bg-tertiary-fixed/60 text-tertiary'
                  : 'bg-surface-container text-primary',
            )}
          >
            <Icon name={icon} className="text-[18px]" />
          </span>
        )}
      </span>
      <span className="mt-1 block font-body-md text-[28px] font-semibold leading-9 tabular-nums text-primary">{value}</span>
      {hint && <span className="mt-0.5 block font-caption text-caption text-on-surface-variant">{hint}</span>}
      {href && (
        <Icon
          name="arrow_forward"
          className="absolute bottom-3 right-3 text-[16px] text-outline transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
        />
      )}
    </>
  )
  const classes = cn(
    'shadow-ambient group relative flex flex-col rounded-xl bg-surface-container-lowest p-4',
    href && 'transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
    className,
  )
  return href ? (
    <NextLink href={href} className={classes}>
      {content}
    </NextLink>
  ) : (
    <div className={classes}>{content}</div>
  )
}
