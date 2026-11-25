import { getTranslations } from 'next-intl/server'
import { getSettings } from '@/lib/api/public'
import type { Locale, PublicSettings } from '@/lib/api/types'
import { Container } from '@/components/ui/Container'
import { ErrorState } from '@/components/ui/ErrorState'
import { Icon } from '@/components/ui/Icon'
import { Skeleton } from '@/components/ui/Skeleton'
import { SmartImage } from '@/components/ui/SmartImage'

/** Icons shown before client names that have no logo yet (Stitch order). */
const FALLBACK_ICONS = [
  { icon: 'account_balance' },
  { icon: 'candlestick_chart' },
  { icon: 'terminal' },
  { icon: 'forest' },
] as const

/**
 * "Confidential Clients & Diplomatic Envoys" strip — names (and logos when uploaded) from
 * settings.corporateClients. Hidden when the CMS list is empty: an empty logo strip has nothing to say.
 */
export async function CorporateClients({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'corporate.clients' })
  const settings: PublicSettings | null = await getSettings(locale).catch(() => null)
  if (!settings) {
    return (
      <Container className="py-space-xl">
        <ErrorState />
      </Container>
    )
  }
  const clients = settings.corporateClients
  if (clients.length === 0) return null

  return (
    <section aria-labelledby="corporate-clients-title" className="w-full bg-surface-container py-space-xl">
      <Container>
        <div className="flex flex-col items-center justify-between gap-space-lg md:flex-row">
          <div className="shrink-0 text-center md:text-left">
            <span className="block font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
              {t('eyebrow')}
            </span>
            <h2 id="corporate-clients-title" className="font-headline-sm text-headline-sm text-primary">
              {t('title')}
            </h2>
          </div>
          <ul
            aria-label={t('listLabel')}
            className="flex flex-wrap items-center justify-center gap-space-xl opacity-70"
          >
            {clients.map((client, index) => (
              <li
                key={client.name}
                className="flex items-center gap-space-xs font-label-lg text-label-lg font-bold uppercase tracking-widest text-on-surface"
              >
                {client.logo ? (
                  <span className="relative block h-8 w-24 shrink-0">
                    <SmartImage image={client.logo} alt="" fill sizes="96px" className="object-contain" />
                  </span>
                ) : (
                  <Icon name={FALLBACK_ICONS[index % FALLBACK_ICONS.length]!.icon} className="text-xl" />
                )}
                <span>{client.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}

export function CorporateClientsSkeleton() {
  return (
    <div aria-hidden="true" className="w-full bg-surface-container py-space-xl">
      <Container className="flex flex-col items-center justify-between gap-space-lg md:flex-row">
        <div className="flex flex-col gap-space-xs">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-6 w-72" />
        </div>
        <div className="flex flex-wrap justify-center gap-space-xl">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-5 w-48" />
          ))}
        </div>
      </Container>
    </div>
  )
}
