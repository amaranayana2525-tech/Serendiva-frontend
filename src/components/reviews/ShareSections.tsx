import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { PageBreadcrumb } from '@/components/about/PageBreadcrumb'
import { Icon } from '@/components/ui/Icon'

/** Hero of /reviews/share — same Stitch styling as the /reviews hero (sand-low, blurred orbs, pill eyebrow). */
export function ShareHero() {
  const t = useTranslations('reviews')
  return (
    <section className="relative w-full overflow-hidden bg-surface-container-low py-space-2xl md:py-space-3xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-secondary/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-primary/5 blur-3xl"
      />
      <div className="relative z-10 mx-auto max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg">
        <PageBreadcrumb
          className="mb-space-lg font-label-md text-label-md uppercase tracking-wider text-on-surface-variant"
          separatorClassName="text-[13px] text-outline-variant"
          items={[
            { label: t('breadcrumb.home'), href: '/' },
            { label: t('breadcrumb.current'), href: '/reviews' },
            { label: t('breadcrumb.share') },
          ]}
        />
        <div className="flex max-w-4xl flex-col">
          <div className="mb-space-md inline-flex w-fit items-center gap-space-sm rounded-full bg-surface px-space-md py-1 shadow-sm">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-secondary" />
            <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
              {t('form.hero.eyebrow')}
            </span>
          </div>
          <h1 className="mb-space-md font-display-lg text-display-lg-mobile tracking-tight text-primary md:text-display-lg">
            {t.rich('form.hero.title', { em: (chunks) => <span className="font-normal italic">{chunks}</span> })}
          </h1>
          <p className="max-w-2xl font-body-xl text-body-xl text-on-surface-variant">{t('form.hero.intro')}</p>
        </div>
      </div>
    </section>
  )
}

const STEPS = [
  { key: 'write', icon: 'edit_note' },
  { key: 'moderate', icon: 'verified_user' },
  { key: 'publish', icon: 'public' },
] as const

/** Side column: how publishing works + email privacy note + back link. */
export function ShareAside() {
  const t = useTranslations('reviews.form.aside')
  return (
    <aside className="flex flex-col gap-gutter lg:sticky lg:top-28">
      <div className="rounded-xl bg-surface-container-low p-space-xl shadow-sm">
        <h2 className="mb-space-md font-headline-sm text-headline-sm text-primary">{t('title')}</h2>
        <ol className="flex flex-col gap-space-md">
          {STEPS.map((step, index) => (
            <li key={step.key} className="flex items-start gap-space-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container text-secondary">
                <Icon name={step.icon} className="text-xl" />
                <span className="sr-only">{index + 1}.</span>
              </span>
              <p className="pt-1 font-body-md text-body-md text-on-surface-variant">{t(`steps.${step.key}`)}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex items-start gap-space-md rounded-xl bg-surface p-space-lg shadow-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tertiary/10 text-tertiary">
          <Icon name="lock" className="text-xl" />
        </span>
        <div>
          <h2 className="font-label-lg text-label-lg font-semibold uppercase tracking-wider text-primary">
            {t('privacyTitle')}
          </h2>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{t('privacyBody')}</p>
        </div>
      </div>
      <Link
        href="/reviews"
        className="tap-target relative inline-flex w-fit items-center gap-space-xs rounded-sm font-label-lg text-label-lg font-semibold text-primary underline underline-offset-4 transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <Icon name="arrow_back" className="text-sm" />
        {t('back')}
      </Link>
    </aside>
  )
}
