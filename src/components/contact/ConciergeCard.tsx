import { getTranslations } from 'next-intl/server'
import { getSettings } from '@/lib/api/public'
import type { Locale, PublicSettings } from '@/lib/api/types'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { Icon } from '@/components/ui/Icon'
import { Skeleton } from '@/components/ui/Skeleton'
import { SmartImage } from '@/components/ui/SmartImage'
import { OnlineBadge } from './OnlineBadge'

async function loadSettings(locale: Locale): Promise<PublicSettings | null> {
  try {
    return await getSettings(locale)
  } catch {
    return null
  }
}

/**
 * Right-hand "personal concierge" card of /contact: guide portrait (settings), online dot, licence, quote,
 * WhatsApp CTA, response time, reassurance bullets and hours / email / base — all contact data from the CMS.
 */
export async function ConciergeCard({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'contact.concierge' })
  const tPage = await getTranslations({ locale, namespace: 'contact.breadcrumb' })
  const settings = await loadSettings(locale)
  const guide = settings?.guide
  const contact = settings?.contact
  const bullets = ['direct', 'revisions', 'vehicle'] as const

  return (
    <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-xl">
      <div aria-hidden="true" className="relative h-28 bg-gradient-to-r from-primary to-primary-container">
        <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] opacity-20 [background-size:16px_16px]" />
      </div>
      <div className="relative z-10 -mt-16 flex flex-col items-center px-space-lg pb-space-lg text-center">
        <div className="relative mb-space-sm">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-surface-container-lowest bg-surface-container shadow-xl">
            <SmartImage image={guide?.portrait} fill sizes="112px" className="object-cover" />
          </div>
          <OnlineBadge
            hours={contact?.hours ?? null}
            online={t('online')}
            away={t('away')}
            onlineLabel={t('onlineLabel')}
            awayLabel={t('awayLabel')}
          />
        </div>

        {guide && (
          <>
            <h3 className="font-headline-sm text-headline-sm font-bold text-primary">{guide.name}</h3>
            <p className="mt-0.5 font-label-md text-label-md uppercase tracking-widest text-secondary">{guide.title}</p>
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-surface-container px-space-sm py-0.5 font-caption text-caption text-on-surface-variant">
              <Icon name="badge" className="text-xs text-primary" />
              <span>{t('licence', { licence: guide.licenseNumber })}</span>
            </div>
          </>
        )}

        <p className="mt-space-md text-left font-body-md text-body-md leading-relaxed text-on-surface-variant">
          {t('quote')}
        </p>

        <div className="mt-space-lg w-full">
          <WhatsAppLink
            page={tPage('current')}
            ignorePageContext
            className="group inline-flex w-full items-center justify-center gap-space-sm rounded-xl bg-tertiary-container px-space-md py-space-md font-label-lg text-label-lg text-on-tertiary shadow-md transition-all hover:bg-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Icon name="chat" className="text-xl transition-transform group-hover:scale-110" />
            <span>
              {contact?.whatsappDisplay ? t('whatsapp', { number: contact.whatsappDisplay }) : t('whatsappShort')}
            </span>
          </WhatsAppLink>
          {contact?.responseTime && (
            <span className="mt-1 block font-caption text-caption text-on-surface-variant">{contact.responseTime}</span>
          )}
        </div>

        <ul className="mt-space-lg flex w-full flex-col gap-space-sm border-t border-surface-container pt-space-md text-left">
          {bullets.map((key) => (
            <li key={key} className="flex items-start gap-space-xs">
              <Icon name="check_circle" className="mt-0.5 shrink-0 text-base text-tertiary" />
              <span className="font-body-md text-body-md text-on-surface">{t(`bullets.${key}`)}</span>
            </li>
          ))}
        </ul>

        {contact && (
          <ul className="mt-space-lg flex w-full flex-col gap-space-xs rounded-xl bg-surface-container-low p-space-md text-left">
            <li className="flex items-center gap-space-xs font-caption text-caption text-on-surface-variant">
              <Icon name="schedule" className="shrink-0 text-sm text-primary" />
              <span>{t('hours', { hours: contact.hours })}</span>
            </li>
            <li className="flex items-center gap-space-xs font-caption text-caption text-on-surface-variant">
              <Icon name="mail" className="shrink-0 text-sm text-primary" />
              <a
                href={`mailto:${contact.email}`}
                className="tap-target relative break-all rounded transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {contact.email}
              </a>
            </li>
            <li className="flex items-center gap-space-xs font-caption text-caption text-on-surface-variant">
              <Icon name="map" className="shrink-0 text-sm text-primary" />
              <span>{t('base', { area: contact.serviceArea })}</span>
            </li>
          </ul>
        )}
        {!settings && (
          <p className="mt-space-md font-caption text-caption text-on-surface-variant">{t('unavailable')}</p>
        )}
      </div>
    </div>
  )
}

/** Suspense fallback with the card's silhouette. */
export function ConciergeCardSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-xl">
      <div className="h-28 bg-gradient-to-r from-primary to-primary-container" />
      <div className="-mt-16 flex flex-col items-center gap-space-sm px-space-lg pb-space-lg">
        <Skeleton className="h-28 w-28 rounded-full border-4 border-surface-container-lowest" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-3 w-56" />
        <Skeleton className="mt-space-md h-24 w-full" />
        <Skeleton className="mt-space-md h-14 w-full rounded-xl" />
        <Skeleton className="mt-space-md h-28 w-full rounded-xl" />
      </div>
    </div>
  )
}
