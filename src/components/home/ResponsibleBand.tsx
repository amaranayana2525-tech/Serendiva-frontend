import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { listEntries, loose } from '@/lib/page-content/lists'

const PILLARS = [{ key: 'plastic' }, { key: 'equity' }, { key: 'safari' }] as const

/** Section 10 — "Travel Smart, Tread Lightly" sustainability band (tea-green card) → /responsible-travel. */
export function ResponsibleBand() {
  const t = useTranslations('home.responsible')
  const tl = loose(t)
  const pillars = listEntries(tl.raw('pillars'), PILLARS)
  return (
    <section className="w-full bg-surface-container py-space-2xl">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-tertiary p-space-xl text-on-tertiary shadow-xl">
          <div className="relative z-10 flex max-w-3xl flex-col gap-space-md">
            <div className="inline-flex w-fit items-center gap-space-xs rounded-full bg-surface/15 px-space-sm py-1">
              <Icon name="eco" className="text-sm text-tertiary-fixed" />
              <span className="font-label-md text-label-md uppercase tracking-widest text-surface">{t('eyebrow')}</span>
            </div>
            <h2 className="font-headline-xl text-headline-xl text-surface">{t('title')}</h2>
            <p className="font-body-lg text-body-lg font-light text-surface-container">{t('intro')}</p>
            <ul className="grid grid-cols-1 gap-space-md pt-space-xs sm:grid-cols-3">
              {pillars.map(({ key }) => (
                <li key={key} className="flex flex-col gap-1">
                  <h3 className="font-label-lg text-label-lg font-bold text-tertiary-fixed">
                    {tl(`pillars.${key}.title`)}
                  </h3>
                  <p className="font-caption text-caption text-surface-container/80">{tl(`pillars.${key}.body`)}</p>
                </li>
              ))}
            </ul>
            <div className="pt-space-xs">
              <Link
                href="/responsible-travel"
                className="tap-target relative inline-flex items-center gap-1 rounded font-label-lg text-label-lg text-tertiary-fixed underline-offset-4 transition-colors hover:text-surface hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-tertiary"
              >
                <span>{t('cta')}</span>
                <Icon name="arrow_forward" className="text-sm" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
