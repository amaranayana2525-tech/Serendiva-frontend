import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { getAvailability } from '@/lib/api/public'
import type { ApiImage, AvailabilityCalendar as AvailabilityCalendarDto, Locale } from '@/lib/api/types'
import { ErrorState } from '@/components/ui/ErrorState'
import { Icon } from '@/components/ui/Icon'
import { Skeleton } from '@/components/ui/Skeleton'
import { SmartImage } from '@/components/ui/SmartImage'
import { ContactAvailabilityClient } from './ContactAvailabilityClient'

/* Smaller /contact pieces around the wizard: trust badges, editorial photo and the availability calendar. */

const TRUST = [
  { key: 'licensed', icon: 'verified_user', tone: 'text-tertiary' },
  { key: 'revisions', icon: 'published_with_changes', tone: 'text-secondary' },
  { key: 'direct', icon: 'no_accounts', tone: 'text-primary' },
] as const

/** The three reassurance badges under the planner card. */
export function TrustBadges({ licence }: { licence: string | null }) {
  const t = useTranslations('contact.trust')
  return (
    <ul className="grid grid-cols-1 gap-space-md md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
      {TRUST.map((item) => (
        <li
          key={item.key}
          className="flex items-center gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-sm"
        >
          <Icon name={item.icon} className={`shrink-0 text-2xl ${item.tone}`} />
          <div className="flex flex-col">
            <span className="font-label-lg text-label-lg font-semibold text-primary">{t(`${item.key}.title`)}</span>
            <span className="font-caption text-caption text-on-surface-variant">
              {item.key === 'licensed'
                ? licence
                  ? t('licensed.body', { licence })
                  : t('licensed.bodyFallback')
                : t(`${item.key}.body`)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Tea-train photo with the italic quote (settings.pageImages['plan-tea-train-vista']). */
export function EditorialPhoto({ image }: { image: ApiImage | null }) {
  const t = useTranslations('contact.concierge')
  return (
    <figure className="group relative overflow-hidden rounded-xl shadow-md">
      <div className="relative h-44 w-full overflow-hidden">
        <SmartImage
          image={image}
          fill
          sizes="(min-width: 1024px) 400px, 100vw"
          className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
        />
      </div>
      <figcaption className="absolute inset-0 flex items-end bg-gradient-to-t from-primary/80 via-transparent to-transparent p-space-md">
        <span className="font-headline-sm text-headline-sm italic text-on-primary">{t('photoQuote')}</span>
      </figcaption>
    </figure>
  )
}

/** Interactive availability calendar (GET /availability). */
export async function ContactAvailability({
  locale,
  calendar: initialCalendar,
}: {
  locale: Locale
  calendar?: AvailabilityCalendarDto | null
}) {
  const t = await getTranslations({ locale, namespace: 'contact.concierge' })
  const calendar = initialCalendar !== undefined ? initialCalendar : await getAvailability().catch(() => null)
  if (!calendar) return <ErrorState />
  return <ContactAvailabilityClient calendar={calendar} title={t('availabilityTitle')} />
}

export function AvailabilitySkeleton() {
  return <Skeleton className="h-[30rem] w-full rounded-2xl" />
}
