'use client'

import { useId, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { scrollToId } from '@/components/blog/useScrollSpy'
import { Icon } from '@/components/ui/Icon'
import { useGuide } from './GuideProvider'

/** Stitch "Guide Fast Search Box": live filter over the chapters; Enter jumps to the first matching chapter. */
export function GuideSearch() {
  const t = useTranslations('travelGuide.hero')
  const { query, search, matches } = useGuide()
  const inputId = useId()
  const statusId = `${inputId}-status`
  const trimmed = query.trim()

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const first = matches?.[0]
    if (first) scrollToId(first, { focus: true })
  }

  return (
    <form role="search" onSubmit={onSubmit} className="relative mt-space-sm max-w-xl" aria-label={t('searchLabel')}>
      <div className="relative">
        <label htmlFor={inputId} className="sr-only">
          {t('searchLabel')}
        </label>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-space-md text-primary">
          <Icon name="search" className="text-[20px]" />
        </div>
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => search(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && query) {
              event.preventDefault()
              search('')
            }
          }}
          placeholder={t('searchPlaceholder')}
          autoComplete="off"
          enterKeyHint="search"
          aria-describedby={statusId}
          className="w-full rounded-xl bg-surface-container-lowest py-3.5 pl-12 pr-12 font-body-md text-body-md text-on-surface shadow-md transition-all placeholder:text-on-surface-variant/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:pr-28 [&::-webkit-search-cancel-button]:hidden"
        />
        {trimmed ? (
          <button
            type="button"
            onClick={() => search('')}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Icon name="close" className="text-[18px]" />
            <span className="sr-only">{t('clearSearch')}</span>
          </button>
        ) : (
          <span
            aria-hidden="true"
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded bg-surface-container px-2 py-1 font-label-md text-[10px] uppercase tracking-wider text-on-surface-variant sm:inline-flex"
          >
            {t('searchBadge')}
          </span>
        )}
      </div>
      <p
        id={statusId}
        aria-live="polite"
        className="absolute left-0 top-full mt-space-xs font-caption text-caption text-on-surface-variant"
      >
        {trimmed && matches ? t('searchResults', { count: matches.length, query: trimmed }) : null}
      </p>
    </form>
  )
}
