'use client'

import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslations } from 'next-intl'
import type { TourDay } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { useHydrated } from './useHydrated'

export interface TourItineraryProps {
  days: TourDay[]
}

const pad = (n: number) => String(n).padStart(2, '0')

const paragraphs = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

/**
 * Day-by-day timeline (Stitch "SECTION B"): one accordion card per day (heading + button, aria-expanded/controls,
 * ↑/↓/Home/End between days). Highlight days are emphasised and open by default; "Expand all N days" toggles all.
 * Collapsed panels stay in the DOM (hidden) so the whole itinerary is crawlable.
 */
export function TourItinerary({ days }: TourItineraryProps) {
  const t = useTranslations('tourDetail.itinerary')
  const baseId = useId()
  const hydrated = useHydrated()
  const sorted = [...days].sort((a, b) => a.dayNumber - b.dayNumber)
  const [open, setOpen] = useState<Set<number>>(() => {
    const highlights = sorted.filter((d) => d.isHighlight).map((d) => d.dayNumber)
    return new Set(highlights.length > 0 ? highlights : sorted.slice(0, 1).map((d) => d.dayNumber))
  })
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const allOpen = sorted.length > 0 && sorted.every((d) => open.has(d.dayNumber))
  const panelId = (n: number) => `${baseId}-day-${n}-panel`

  const toggle = (n: number) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else next.add(n)
      return next
    })

  const toggleAll = () => setOpen(allOpen ? new Set() : new Set(sorted.map((d) => d.dayNumber)))

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = sorted.length - 1
    const target =
      event.key === 'ArrowDown'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowUp'
          ? index === 0
            ? last
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null
    if (target === null) return
    event.preventDefault()
    buttons.current[target]?.focus()
  }

  return (
    <section
      id="itinerary"
      data-hydrated={hydrated || undefined}
      aria-labelledby={`${baseId}-title`}
      className="flex scroll-mt-36 flex-col gap-space-lg"
    >
      <div className="flex flex-col justify-between gap-space-sm md:flex-row md:items-end">
        <div>
          <span className="font-label-lg text-label-lg uppercase tracking-widest text-secondary">{t('eyebrow')}</span>
          <h2 id={`${baseId}-title`} className="font-headline-lg text-headline-lg text-primary">
            {t('title')}
          </h2>
        </div>
        {sorted.length > 1 && (
          <button
            type="button"
            onClick={toggleAll}
            aria-expanded={allOpen}
            aria-controls={sorted.map((d) => panelId(d.dayNumber)).join(' ')}
            className="tap-target relative self-start rounded font-label-lg text-label-lg text-primary underline transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:self-auto"
          >
            {allOpen ? t('collapseAll') : t('expandAll', { count: sorted.length })}
          </button>
        )}
      </div>

      <ol className="relative flex flex-col gap-space-md">
        {sorted.map((day, index) => {
          const isOpen = open.has(day.dayNumber)
          const highlight = day.isHighlight
          const buttonId = `${baseId}-day-${day.dayNumber}`
          const badgeId = `${buttonId}-badge`
          const titleId = `${buttonId}-title`
          const meta = [day.drivingTime, day.meals ? t('meals', { meals: day.meals }) : null, day.overnightArea].filter(
            (v): v is string => Boolean(v),
          )
          return (
            <li
              key={day.dayNumber}
              className={cn(
                'overflow-hidden rounded-xl transition-all duration-300',
                highlight ? 'bg-surface-container shadow-md' : 'bg-surface-container-low shadow-sm',
              )}
            >
              <h3 className="m-0">
                <button
                  ref={(el) => {
                    buttons.current[index] = el
                  }}
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId(day.dayNumber)}
                  aria-labelledby={`${badgeId} ${titleId}`}
                  onClick={() => toggle(day.dayNumber)}
                  onKeyDown={(e) => onKeyDown(e, index)}
                  className="flex w-full items-center justify-between gap-space-md rounded-xl p-space-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                >
                  <span className="flex items-center gap-space-md">
                    <span
                      id={badgeId}
                      className={cn(
                        'flex h-10 w-16 shrink-0 items-center justify-center rounded-lg font-label-lg text-label-lg font-bold uppercase tracking-wider',
                        highlight ? 'bg-secondary text-on-secondary' : 'bg-primary text-on-primary',
                      )}
                    >
                      {t('day', { number: pad(day.dayNumber) })}
                    </span>
                    <span className="block">
                      <span className="flex items-center gap-2">
                        <span id={titleId} className="font-headline-sm text-headline-sm text-primary">
                          {day.title}
                        </span>
                        {highlight && (
                          <span className="hidden shrink-0 rounded bg-secondary-fixed px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-secondary-fixed sm:inline-block">
                            {t('highlight')}
                          </span>
                        )}
                      </span>
                      {meta.length > 0 && (
                        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-caption text-caption text-on-surface-variant">
                          {meta.map((item, i) => (
                            <span key={i} className="flex items-center gap-3">
                              {i > 0 && <span aria-hidden="true">•</span>}
                              <span>{item}</span>
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                  </span>
                  <Icon
                    name="expand_more"
                    className={cn(
                      'shrink-0 transform text-2xl text-primary transition-transform duration-300',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>
              </h3>
              <div
                id={panelId(day.dayNumber)}
                role="region"
                aria-labelledby={buttonId}
                hidden={!isOpen}
                className="px-space-lg pb-space-lg"
              >
                <div className="flex flex-col gap-space-md pt-space-xs text-body-md text-on-surface">
                  {paragraphs(day.description).map((p, i) => (
                    <p key={i} className="leading-relaxed text-on-surface-variant">
                      {p}
                    </p>
                  ))}
                  {day.details.length > 0 && (
                    <dl className="grid grid-cols-1 gap-space-sm rounded-lg bg-surface p-space-md font-caption text-caption text-on-surface-variant md:grid-cols-3">
                      {day.details.map((detail, i) => (
                        <div key={i}>
                          <dt className="block font-semibold text-primary">
                            {t('detailLabel', { label: detail.label })}
                          </dt>
                          <dd>{detail.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
