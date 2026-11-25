import { useTranslations } from 'next-intl'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { listEntries, loose } from '@/lib/page-content/lists'

const STEPS = [
  { key: 'share', icon: 'edit_note', footer: { icon: 'schedule' } },
  { key: 'curate', icon: 'architecture', footer: { icon: 'bolt' } },
  { key: 'refine', icon: 'tune', footer: { icon: 'all_inclusive' } },
  { key: 'welcome', icon: 'flight_land', footer: { icon: 'verified' } },
] as const

/** "How my bespoke planning works" — four numbered cards (Stitch methodology band). */
export function PlanningProcess() {
  const t = useTranslations('contact.process')
  const tl = loose(t)
  const steps = listEntries(tl.raw('steps'), STEPS)
  return (
    <section aria-labelledby="planning-process-title" className="w-full bg-surface-container-low py-space-3xl">
      <Container>
        <div className="mx-auto mb-space-2xl max-w-2xl text-center">
          <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">{t('eyebrow')}</span>
          <h2 id="planning-process-title" className="mt-space-xs font-headline-xl text-headline-xl text-primary">
            {t('title')}
          </h2>
          <p className="mt-space-xs font-body-lg text-body-lg text-on-surface-variant">{t('intro')}</p>
        </div>
        <ol className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ key, meta: step, icon }, index) => (
            <Reveal
              as="li"
              key={key}
              delay={index * 0.08}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-md"
            >
              <div className="mb-space-md flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
                  {icon && <Icon name={icon} className="text-2xl" />}
                </div>
                <span
                  aria-hidden="true"
                  className="font-display-lg text-display-lg font-bold text-surface-container-high"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <div>
                <h3 className="mb-space-xs font-headline-sm text-headline-sm font-semibold text-primary">
                  {tl(`steps.${key}.title`)}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{tl(`steps.${key}.body`)}</p>
              </div>
              <div className="mt-space-md flex items-center gap-1 border-t border-surface-container pt-space-sm font-label-md text-label-md text-tertiary">
                <Icon name={step.footer.icon} className="text-sm" />
                <span>{tl(`steps.${key}.footer`)}</span>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  )
}
