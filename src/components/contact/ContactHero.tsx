import { useTranslations } from 'next-intl'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { StitchBreadcrumbs } from './StitchBreadcrumbs'

/** Editorial header of /contact: breadcrumb, "100% bespoke" pill, h1 and intro (Stitch plan_my_trip). */
export function ContactHero({ guideName }: { guideName: string | null }) {
  const t = useTranslations('contact')
  return (
    <Container className="relative pb-space-lg pt-space-xl">
      <StitchBreadcrumbs
        items={[{ label: t('breadcrumb.home'), href: '/' }, { label: t('breadcrumb.current') }]}
        className="mb-space-lg font-label-md text-label-md uppercase tracking-widest text-on-surface-variant"
        linkClassName="hover:text-primary"
        currentClassName="font-semibold text-primary"
        separatorClassName="text-outline"
      />
      <div className="max-w-4xl">
        <div className="mb-space-md inline-flex items-center gap-space-xs rounded-full bg-surface-container px-space-md py-space-xs font-label-md text-label-md text-tertiary shadow-sm">
          <Icon name="diamond" className="text-sm text-tertiary" />
          <span>{t('hero.pill')}</span>
        </div>
        <h1 className="mb-space-md font-headline-xl text-headline-xl tracking-tight text-primary lg:text-display-lg">
          {t('hero.title')}
        </h1>
        <p className="max-w-3xl font-body-xl text-body-xl leading-relaxed text-on-surface-variant">
          {t('hero.intro', { name: guideName ?? t('hero.introFallbackName') })}
        </p>
      </div>
    </Container>
  )
}
