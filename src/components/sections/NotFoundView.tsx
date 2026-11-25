import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Icon } from '@/components/ui/Icon'

/** Body of the 404 page (rendered inside the site chrome). */
export function NotFoundView() {
  const t = useTranslations('common')
  return (
    <section className="relative w-full overflow-hidden py-space-3xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary-fixed/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-secondary-fixed/30 blur-3xl"
      />
      <Container className="relative flex flex-col items-center gap-space-lg text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-container text-secondary shadow-sm">
          <Icon name="explore" className="text-[40px]" />
        </span>
        <Eyebrow size="lg">{t('notFound.eyebrow')}</Eyebrow>
        <h1 className="max-w-3xl font-display-lg text-display-lg-mobile text-primary md:text-display-lg">
          {t('notFound.title')}
        </h1>
        <p className="max-w-2xl font-body-xl text-body-lg font-light text-on-surface-variant md:text-body-xl">
          {t('notFound.body')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-space-md pt-space-sm">
          <Button href="/" variant="primary" size="lg" leadingIcon="home" uppercase>
            {t('notFound.home')}
          </Button>
          <Button href="/tours" variant="soft" size="lg" leadingIcon="travel_explore" uppercase>
            {t('notFound.tours')}
          </Button>
          <Button href="/contact" variant="accent" size="lg" leadingIcon="edit_calendar" uppercase>
            {t('notFound.contact')}
          </Button>
        </div>
      </Container>
    </section>
  )
}
