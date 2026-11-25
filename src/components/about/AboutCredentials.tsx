import { Fragment } from 'react'
import { useTranslations } from 'next-intl'
import type { PublicSettings } from '@/lib/api/types'
import { Link } from '@/i18n/navigation'
import { contactHref } from '@/lib/prefill'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { languageProfile, type LanguageProfileKey } from './guide'

const ROWS = [
  { key: 'firstAid', icon: 'medical_services', iconTone: 'text-tertiary', valueTone: 'text-tertiary' },
  { key: 'chauffeur', icon: 'directions_car', iconTone: 'text-primary', valueTone: 'text-primary' },
  { key: 'wildlife', icon: 'park', iconTone: 'text-secondary', valueTone: 'text-secondary' },
] as const

/** Bar colour rhythm from the Stitch language block (cinnamon → teal → tea green). */
const BAR_TONES = [
  { bar: 'bg-secondary', text: 'text-secondary' },
  { bar: 'bg-primary', text: 'text-primary' },
  { bar: 'bg-tertiary-container', text: 'text-tertiary' },
] as const

/** Stitch "Official Credentials & Accreditations Showcase": certificate card (licence from settings) + language mastery. */
export function AboutCredentials({ settings }: { settings: PublicSettings | null }) {
  const t = useTranslations('about')
  const licence = settings?.guide.licenseNumber
  const languages = settings?.guide.languages ?? []

  const profiles: LanguageProfileKey[] = []
  const others: string[] = []
  let speaksSinhala = false
  for (const language of languages) {
    const profile = languageProfile(language)
    if (profile === 'sinhala') speaksSinhala = true
    else if (profile && !profiles.includes(profile)) profiles.push(profile)
    else if (!profile) others.push(language)
  }

  return (
    <section className="w-full bg-surface-container-low py-space-3xl">
      <div className="mx-auto max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg">
        <div className="grid grid-cols-1 items-center gap-gutter-lg lg:grid-cols-12">
          {/* Certificate card */}
          <div className="relative overflow-hidden rounded-2xl bg-surface p-space-lg shadow-xl sm:p-space-xl lg:col-span-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-secondary/5"
            />
            <div className="flex items-center justify-between gap-space-sm pb-space-lg">
              <div className="flex items-center gap-space-sm">
                <Icon name="military_tech" className="shrink-0 text-3xl text-primary" />
                <div>
                  <span className="block font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
                    {t('credentials.eyebrow')}
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-primary">{t('credentials.title')}</h2>
                </div>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tertiary/15 text-tertiary">
                <Icon name="verified" className="text-2xl" />
              </div>
            </div>

            <ul className="space-y-space-md py-space-md">
              <li className="flex items-start justify-between gap-space-sm rounded-lg bg-surface-container-low p-space-sm">
                <div className="flex items-start gap-space-sm">
                  <Icon name="badge" className="mt-px shrink-0 text-lg text-secondary" />
                  <div>
                    <span className="block font-label-lg text-label-lg text-primary">
                      {t('credentials.rows.guide.title')}
                    </span>
                    <span className="block font-caption text-caption text-on-surface-variant">
                      {t('credentials.rows.guide.issuer')}
                    </span>
                  </div>
                </div>
                {licence && (
                  <span className="min-w-0 max-w-[45%] text-right font-label-md text-label-md font-bold text-secondary sm:max-w-none">
                    #
                    {licence.split('/').map((part, i) => (
                      <Fragment key={i}>
                        {i > 0 && (
                          <>
                            /<wbr />
                          </>
                        )}
                        {part}
                      </Fragment>
                    ))}
                  </span>
                )}
              </li>
              {ROWS.map((row) => (
                <li
                  key={row.key}
                  className="flex items-start justify-between gap-space-sm rounded-lg bg-surface-container-low p-space-sm"
                >
                  <div className="flex items-start gap-space-sm">
                    <Icon name={row.icon} className={cn('mt-px shrink-0 text-lg', row.iconTone)} />
                    <div>
                      <span className="block font-label-lg text-label-lg text-primary">
                        {t(`credentials.rows.${row.key}.title`)}
                      </span>
                      <span className="block font-caption text-caption text-on-surface-variant">
                        {t(`credentials.rows.${row.key}.issuer`)}
                      </span>
                    </div>
                  </div>
                  <span className={cn('shrink-0 font-label-md text-label-md font-bold', row.valueTone)}>
                    {t(`credentials.rows.${row.key}.value`)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-space-lg flex flex-wrap items-center justify-between gap-space-md pt-space-md">
              <span className="flex items-center gap-1 font-caption text-caption text-on-surface-variant">
                <Icon name="check_circle" className="shrink-0 text-xs text-tertiary" />
                {t('credentials.auditable')}
              </span>
              <Link
                href={contactHref({ message: t('credentials.requestMessage'), source: 'about-credentials' })}
                className="flex items-center gap-1 rounded-lg bg-primary px-space-md py-2 font-label-md text-label-md text-on-primary transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 coarse:min-h-11"
              >
                <Icon name="verified" className="text-xs" />
                <span>{t('credentials.request')}</span>
              </Link>
            </div>
          </div>

          {/* Languages */}
          <div className="flex flex-col gap-space-lg lg:col-span-6">
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-md text-label-md font-semibold uppercase tracking-widest text-secondary">
                {t('languages.eyebrow')}
              </span>
              <h2 className="font-headline-xl text-headline-xl text-primary">{t('languages.title')}</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">{t('languages.intro')}</p>
            </div>

            {profiles.length > 0 && (
              <ul className="space-y-space-lg">
                {profiles.map((key, index) => {
                  const tone = BAR_TONES[index % BAR_TONES.length]!
                  const level = Number(t(`languages.profiles.${key}.level`))
                  const name = t(`languages.profiles.${key}.name`)
                  return (
                    <li key={key} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-space-sm">
                        <div className="flex flex-wrap items-center gap-x-2">
                          <span className="font-label-lg text-label-lg font-semibold text-primary">{name}</span>
                          <span className="font-caption text-caption text-on-surface-variant">
                            {t(`languages.profiles.${key}.note`)}
                          </span>
                        </div>
                        <span className={cn('shrink-0 font-label-md text-label-md font-bold', tone.text)}>
                          {level}%
                        </span>
                      </div>
                      <div
                        role="meter"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={level}
                        aria-label={t('languages.fluencyLabel', { language: name, level })}
                        className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container"
                      >
                        <div className={cn('h-full rounded-full', tone.bar)} style={{ width: `${level}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            {others.length > 0 && (
              <p className="font-body-md text-body-md text-on-surface-variant">
                <span className="font-label-lg text-label-lg text-primary">{t('languages.otherTitle')}: </span>
                {others.join(' • ')}
              </p>
            )}

            {(speaksSinhala || languages.length === 0) && (
              <div className="flex items-center gap-space-md rounded-xl bg-surface p-space-md shadow-sm">
                <Icon name="record_voice_over" className="shrink-0 text-2xl text-secondary" />
                <p className="font-caption text-caption text-on-surface-variant">{t('languages.sinhalaNote')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
