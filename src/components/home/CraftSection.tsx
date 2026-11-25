import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { PublicSettings } from '@/lib/api/types'
import { contactHref } from '@/lib/prefill'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { SmartImage } from '@/components/ui/SmartImage'
import { listEntries, loose } from '@/lib/page-content/lists'

const STEPS = [
  { key: 'share', tone: 'bg-secondary text-on-secondary' },
  { key: 'blueprint', tone: 'bg-primary text-on-primary' },
  { key: 'arrive', tone: 'bg-tertiary text-on-tertiary' },
] as const

/** Section 6 — "How I Craft Your Journey": high-tea photo with quote card, 3 numbered steps, CTA → /contact. */
export function CraftSection({ settings }: { settings: PublicSettings | null }) {
  const t = useTranslations('home.craft')
  const tl = loose(t)
  const steps = listEntries(tl.raw('steps'), STEPS)
  const guideName = settings?.guide.name
  return (
    <section className="w-full bg-surface py-space-3xl">
      <Container>
        <div className="grid grid-cols-1 items-center gap-gutter-lg lg:grid-cols-12">
          <div className="relative lg:col-span-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-2xl">
              <SmartImage
                image={settings?.pageImages['home-craft-high-tea-pavilion']}
                fill
                sizes="(min-width: 1440px) 640px, (min-width: 1024px) 50vw, 100vw"
                className="h-full w-full object-cover"
              />
            </div>
            {t.has('quote') && (
              <figure className="absolute -bottom-6 left-6 right-6 rounded-xl bg-surface-container-high/95 p-space-md shadow-lg backdrop-blur-md">
                <blockquote className="font-headline-sm text-headline-sm italic text-primary">{t('quote')}</blockquote>
                {guideName && (
                  <figcaption className="mt-1 block font-caption text-caption font-semibold text-secondary">
                    — {guideName}
                  </figcaption>
                )}
              </figure>
            )}
          </div>

          <div className="flex flex-col gap-space-xl pt-10 lg:col-span-6 lg:pt-0">
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-lg text-label-lg font-semibold uppercase tracking-widest text-secondary">
                {t('eyebrow')}
              </span>
              <h2 className="font-headline-xl text-headline-xl text-primary">{t('title')}</h2>
            </div>
            <ol className="flex flex-col gap-space-lg">
              {steps.map(({ key, meta: step }, i) => (
                <Reveal as="li" key={key} delay={i * 0.08} className="flex items-start gap-space-md">
                  <div
                    aria-hidden="true"
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-headline-sm font-bold ${step.tone}`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-headline-md text-headline-md text-primary">{tl(`steps.${key}.title`)}</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">{tl(`steps.${key}.body`)}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
            <div>
              <Link
                href={contactHref({ source: 'home-craft' })}
                className="inline-flex items-center gap-2 rounded-xl bg-secondary px-space-xl py-4 font-label-lg text-label-lg uppercase tracking-wider text-on-secondary shadow-md transition-all hover:bg-on-secondary-fixed-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
