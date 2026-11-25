import { useTranslations } from 'next-intl'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { listEntries, loose } from '@/lib/page-content/lists'

const PILLARS = [
  { key: 'wildlife', icon: 'distance' },
  { key: 'plastic', icon: 'no_drinks' },
  { key: 'community', icon: 'handshake' },
  { key: 'culture', icon: 'temple_buddhist' },
] as const

/** "The Four Pillars of Conscious Custodianship". */
export function ResponsiblePillars() {
  const t = useTranslations('responsible.pillars')
  const tl = loose(t)
  const pillars = listEntries(tl.raw('items'), PILLARS)
  return (
    <section aria-labelledby="pillars-title" className="w-full bg-surface py-space-3xl">
      <Container>
        <div className="mb-space-2xl flex flex-col justify-between gap-space-md lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <span className="font-label-md text-label-md font-semibold uppercase tracking-[0.2em] text-secondary">
              {t('eyebrow')}
            </span>
            <h2 id="pillars-title" className="mt-space-xs font-headline-xl text-headline-xl text-primary">
              {t('title')}
            </h2>
          </div>
          <p className="max-w-md font-body-md text-body-md text-on-surface-variant">{t('intro')}</p>
        </div>
        <ul className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ key, icon }) => (
            <li
              key={key}
              className="group flex flex-col justify-between rounded-xl bg-surface-container p-space-lg shadow-[0_16px_36px_-12px_rgba(43,43,43,0.06)] transition-all duration-300 hover:bg-surface-container-high"
            >
              <div className="flex flex-col">
                <div className="mb-space-lg flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-on-primary transition-transform group-hover:scale-110">
                  {icon && <Icon name={icon} className="text-[24px]" />}
                </div>
                <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                  {tl(`items.${key}.label`)}
                </span>
                <h3 className="mb-space-sm mt-1 font-headline-sm text-headline-sm text-primary">
                  {tl(`items.${key}.title`)}
                </h3>
                <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
                  {tl(`items.${key}.body`)}
                </p>
              </div>
              <div className="mt-space-md flex items-center gap-space-xs pt-space-lg font-label-md text-label-md font-semibold uppercase tracking-wider text-tertiary">
                <Icon name="check_circle" className="shrink-0 text-[16px]" />
                <span>{tl(`items.${key}.check`)}</span>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
