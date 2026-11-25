import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { PublicSettings, TrustBadge } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { Container } from '@/components/ui/Container'
import { CountUp } from '@/components/ui/CountUp'
import { ErrorState } from '@/components/ui/ErrorState'
import { Icon } from '@/components/ui/Icon'

const TONES: Record<TrustBadge['tone'], { circle: string; icon: string; filled: boolean }> = {
  green: { circle: 'bg-tertiary-container/15', icon: 'text-tertiary', filled: true },
  cinnamon: { circle: 'bg-secondary-fixed', icon: 'text-secondary', filled: false },
  gold: { circle: 'border border-[rgba(201,162,75,0.6)] bg-surface-container', icon: 'text-primary', filled: true },
}

const BADGE = 'col-span-2 flex items-center gap-3 rounded-xl bg-surface p-space-sm shadow-sm sm:col-span-1'

function BadgeBody({
  badge,
  title,
  subtitle,
}: {
  badge: Pick<TrustBadge, 'icon' | 'tone'>
  title: string
  subtitle: string
}) {
  const tone = TONES[badge.tone] ?? TONES.green
  return (
    <>
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', tone.circle)}>
        <Icon name={badge.icon} filled={tone.filled} className={cn('text-xl', tone.icon)} />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="font-label-md text-label-md font-bold text-primary">{title}</span>
        <span className="truncate font-caption text-caption text-on-surface-variant">{subtitle}</span>
      </div>
    </>
  )
}

/**
 * Section 2 — animated counters + accreditation badges (settings.counters / settings.trustBadges). The review badge
 * (the CMS badge with the "star" icon) shows the live review summary and links to /reviews.
 */
export function TrustStrip({ settings }: { settings: PublicSettings | null }) {
  const t = useTranslations('home.trust')
  const summary = settings?.reviewSummary
  const hasReviews = Boolean(summary && summary.count > 0)
  const badges = settings?.trustBadges ?? []
  const reviewBadgeIndex = hasReviews ? badges.findIndex((b) => b.icon === 'star') : -1

  const reviewBadge = (key: string, badge: Pick<TrustBadge, 'icon' | 'tone'>) =>
    summary ? (
      <Link
        key={key}
        href="/reviews"
        className={cn(
          BADGE,
          'transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        )}
      >
        <BadgeBody
          badge={badge}
          title={t('reviewTitle', { rating: summary.average.toFixed(1) })}
          subtitle={t('reviewCount', { count: summary.count })}
        />
      </Link>
    ) : null

  return (
    <section id="trust-strip" aria-label={t('label')} className="w-full scroll-mt-20 bg-surface-container py-space-xl">
      <Container>
        {settings ? (
          <div className="grid grid-cols-2 items-center gap-space-lg md:grid-cols-4 lg:grid-cols-6">
            {settings.counters.map((c) => (
              <div key={c.label} className="flex flex-col">
                <CountUp value={c.value} className="font-headline-xl text-headline-xl font-bold text-primary" />
                <span className="font-body-md text-body-md font-medium text-on-surface-variant">{c.label}</span>
              </div>
            ))}
            {badges.map((b, i) =>
              i === reviewBadgeIndex ? (
                reviewBadge(`badge-${i}`, b)
              ) : (
                <div key={`badge-${i}`} className={BADGE}>
                  <BadgeBody badge={b} title={b.title} subtitle={b.subtitle} />
                </div>
              ),
            )}
            {hasReviews && reviewBadgeIndex === -1 && reviewBadge('badge-reviews', { icon: 'star', tone: 'cinnamon' })}
          </div>
        ) : (
          <ErrorState retryHref="/" />
        )}
      </Container>
    </section>
  )
}
