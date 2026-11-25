import { useTranslations } from 'next-intl'
import type { MonthRating, Region } from '@/lib/api/types'
import { MONTH_KEYS } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Cell styles + glyphs exactly as the Stitch "Dual-Monsoon Seasonal Matrix". */
const CELL: Record<MonthRating, { className: string; glyph: string }> = {
  peak: { className: 'bg-secondary text-on-secondary font-bold', glyph: '☀️' },
  good: { className: 'bg-tertiary-fixed-dim text-tertiary font-semibold', glyph: '⛅' },
  rain: { className: 'bg-surface-container-highest text-on-surface-variant', glyph: '🌧️' },
}
/** Wildlife regions (icon "pets") use paw prints for the open months, as in Stitch. */
const WILDLIFE_GLYPH = '🐾'

/** Legend chips (Peak Sun & Calm / Pleasant / Monsoon). */
export function SeasonLegend({ className }: { className?: string }) {
  const t = useTranslations('common.season')
  const items = [
    { key: 'peak', label: t('legendPeak'), dot: 'bg-secondary' },
    { key: 'good', label: t('legendGood'), dot: 'bg-tertiary-fixed-dim' },
    { key: 'rain', label: t('legendRain'), dot: 'bg-surface-container-highest' },
  ]
  return (
    <ul
      className={cn(
        'flex shrink-0 flex-wrap items-center gap-space-md rounded-xl bg-surface px-space-md py-space-sm shadow-sm',
        className,
      )}
    >
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5 font-caption text-caption">
          <span aria-hidden="true" className={cn('h-3 w-3 rounded-full', item.dot)} />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  )
}

export interface BestTimeMatrixProps {
  /** Regions from GET /regions — each with 12 `bestMonths` ratings (Jan→Dec). Regions without ratings are skipped. */
  regions: Region[]
  /** Accessible table caption (visually hidden). */
  caption?: string
  className?: string
}

/** Month-by-region heat table (scrolls horizontally on small screens). Every cell has a text alternative. */
export function BestTimeMatrix({ regions, caption, className }: BestTimeMatrixProps) {
  const t = useTranslations('common')
  const rows = regions.filter((r) => r.bestMonths.length === 12)
  if (rows.length === 0) return null
  return (
    // Scrolls sideways on phones: focusable + named so keyboard users can scroll it too (WCAG 2.1.1).
    <div
      role="region"
      aria-label={caption ?? t('season.territory')}
      tabIndex={0}
      className={cn(
        'relative w-full overflow-x-auto rounded-2xl bg-surface p-space-md shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:p-space-lg',
        className,
      )}
    >
      <table className="w-full min-w-[760px] border-collapse text-left">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            <th
              scope="col"
              className="px-space-md py-space-sm font-label-md text-label-md uppercase tracking-wider text-primary"
            >
              {t('season.territory')}
            </th>
            {MONTH_KEYS.map((m) => (
              <th
                key={m}
                scope="col"
                className="px-2 py-space-sm text-center font-label-md text-label-md text-on-surface-variant"
              >
                {t(`season.months.${m}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((region) => (
            <tr key={region.id} className="transition-colors hover:bg-surface-container-low">
              <th scope="row" className="px-space-md py-space-md font-normal">
                <div className="flex flex-col">
                  <span className="font-headline-sm text-[16px] font-semibold text-primary">{region.name}</span>
                  {region.places && (
                    <span className="font-caption text-caption text-on-surface-variant">{region.places}</span>
                  )}
                </div>
              </th>
              {region.bestMonths.map((rating, i) => {
                const cell = CELL[rating]
                const glyph = region.icon === 'pets' && rating !== 'rain' ? WILDLIFE_GLYPH : cell.glyph
                return (
                  <td key={MONTH_KEYS[i]} className="p-2 text-center">
                    <span
                      className={cn(
                        'inline-block h-8 w-8 rounded-lg font-label-md text-[11px] leading-8',
                        cell.className,
                      )}
                    >
                      <span aria-hidden="true">{glyph}</span>
                      <span className="sr-only">{t(`a11y.season.${rating}`)}</span>
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
