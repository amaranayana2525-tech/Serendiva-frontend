'use client'

import { useId } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { enabledLocales, locales, type Locale } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'

export interface LanguageSwitcherProps {
  /** 'pill' = Stitch header pill (EN | 中文 | DE) · 'list' = mobile drawer rows. */
  variant?: 'pill' | 'list'
  /** Header over the home hero (white text). */
  overlay?: boolean
  className?: string
}

/**
 * EN / 中文 / DE switcher. Locales not listed in NEXT_PUBLIC_ENABLED_LOCALES stay visible but disabled with a
 * "coming soon" tooltip (the router still serves them, so links shared later keep working).
 */
export function LanguageSwitcher({ variant = 'pill', overlay = false, className }: LanguageSwitcherProps) {
  const t = useTranslations('common.languageSwitcher')
  const current = useLocale() as Locale
  const pathname = usePathname()
  const tooltipBase = useId()

  if (variant === 'list') {
    return (
      <ul aria-label={t('label')} className={cn('flex flex-col gap-1', className)}>
        {locales.map((locale) => {
          const enabled = enabledLocales.includes(locale)
          const active = locale === current
          const name = t(`names.${locale}`)
          return (
            <li key={locale}>
              {enabled && !active ? (
                <Link
                  href={pathname}
                  locale={locale}
                  lang={locale}
                  className="flex items-center justify-between rounded-lg px-space-md py-space-sm font-body-md text-body-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                >
                  <span>{name}</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">{t(`short.${locale}`)}</span>
                </Link>
              ) : (
                <span
                  lang={locale}
                  aria-current={active ? 'true' : undefined}
                  aria-disabled={!enabled && !active ? 'true' : undefined}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-space-md py-space-sm font-body-md text-body-md',
                    active
                      ? 'bg-surface-container font-semibold text-primary'
                      : 'cursor-not-allowed text-on-surface-variant/70',
                  )}
                >
                  <span>{name}</span>
                  <span className="flex items-center gap-1 font-label-md text-label-md">
                    {active ? <Icon name="check" className="text-sm" /> : t('comingSoonShort')}
                  </span>
                </span>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div
      role="group"
      aria-label={t('label')}
      className={cn(
        'hidden items-center rounded-full p-space-xs transition-colors md:flex',
        overlay ? 'bg-surface/15 backdrop-blur-md' : 'bg-surface-container',
        className,
      )}
    >
      {locales.map((locale) => {
        const enabled = enabledLocales.includes(locale)
        const active = locale === current
        const short = t(`short.${locale}`)
        const name = t(`names.${locale}`)
        const base =
          'tap-target relative rounded-full px-space-sm py-0.5 font-label-md text-label-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        const idle = overlay ? 'text-surface/85 hover:text-surface' : 'text-on-surface-variant hover:text-on-surface'
        if (active) {
          return (
            <span
              key={locale}
              lang={locale}
              aria-current="true"
              title={t('current', { language: name })}
              className={cn(base, 'bg-surface font-semibold text-primary shadow-[0_1px_4px_rgba(0,0,0,0.06)]')}
            >
              {short}
            </span>
          )
        }
        if (enabled) {
          return (
            <Link
              key={locale}
              href={pathname}
              locale={locale}
              lang={locale}
              aria-label={t('switchTo', { language: name })}
              className={cn(base, idle)}
            >
              {short}
            </Link>
          )
        }
        const tooltipId = `${tooltipBase}-${locale}`
        return (
          <span key={locale} className="group relative">
            <button
              type="button"
              lang={locale}
              aria-disabled="true"
              aria-describedby={tooltipId}
              onClick={(e) => e.preventDefault()}
              className={cn(base, idle, 'cursor-not-allowed')}
            >
              {short}
            </button>
            <span
              id={tooltipId}
              role="tooltip"
              className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-inverse-surface px-space-sm py-1 font-caption text-caption text-inverse-on-surface opacity-0 shadow-md transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
            >
              {t('comingSoon', { language: name })}
            </span>
          </span>
        )
      })}
    </div>
  )
}
