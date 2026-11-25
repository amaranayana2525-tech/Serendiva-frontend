import { useTranslations } from 'next-intl'
import { MONTH_KEYS } from '@/lib/format'

/**
 * Relative monthly rainfall (% of each coast's wettest month), derived from long-term climate normals for Colombo
 * (south-west monsoon pattern) and Trincomalee (north-east monsoon pattern). Indicative only.
 */
const SOUTH_WEST = [15, 19, 33, 62, 100, 47, 31, 30, 64, 93, 78, 40] as const
const EAST = [47, 18, 13, 14, 16, 6, 14, 27, 29, 57, 96, 100] as const

/** Stitch "Islandwide Rainfall Matrix & Sun Patterns" bar chart, with an equivalent data table for screen readers. */
export function RainfallChart() {
  const t = useTranslations('travelGuide.bestTime.chart')
  const tm = useTranslations('common.season.months')
  return (
    <figure
      aria-labelledby="rainfall-chart-title"
      className="relative rounded-xl bg-surface-container-low p-space-lg shadow-sm"
    >
      <div className="mb-space-md flex flex-col justify-between gap-space-sm sm:flex-row sm:items-center">
        <div>
          <h3 id="rainfall-chart-title" className="font-headline-sm text-headline-sm text-primary">
            {t('title')}
          </h3>
          <p className="font-caption text-caption text-on-surface-variant">{t('subtitle')}</p>
        </div>
        <div aria-hidden="true" className="flex items-center gap-space-md text-caption">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 shrink-0 rounded-sm bg-primary" />
            <span>{t('legendSouthWest')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 shrink-0 rounded-sm bg-secondary" />
            <span>{t('legendEast')}</span>
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="flex h-44 w-full items-end justify-between gap-1 px-2 pt-6">
        {MONTH_KEYS.map((month, i) => (
          <div key={month} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
            <div className="flex h-36 w-full items-end justify-center gap-1">
              <div
                className="w-1/2 rounded-t-sm bg-primary transition-all group-hover:opacity-80"
                style={{ height: `${SOUTH_WEST[i]}%` }}
              />
              <div
                className="w-1/2 rounded-t-sm bg-secondary transition-all group-hover:opacity-80"
                style={{ height: `${EAST[i]}%` }}
              />
            </div>
            <span className="font-caption text-[11px] text-on-surface-variant">{tm(month)}</span>
          </div>
        ))}
      </div>

      <div className="sr-only">
        <table>
          <caption>{t('tableCaption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('month')}</th>
              <th scope="col">{t('legendSouthWest')}</th>
              <th scope="col">{t('legendEast')}</th>
            </tr>
          </thead>
          <tbody>
            {MONTH_KEYS.map((month, i) => (
              <tr key={month}>
                <th scope="row">{tm(month)}</th>
                <td>{t('value', { value: SOUTH_WEST[i] })}</td>
                <td>{t('value', { value: EAST[i] })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <figcaption className="mt-2 text-center font-caption text-caption text-on-surface-variant">
        {t('caption')}
      </figcaption>
    </figure>
  )
}
