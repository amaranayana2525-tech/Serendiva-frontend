import { useTranslations } from 'next-intl'
import { NewsletterForm } from '@/components/forms/NewsletterForm'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'

/** Deep-teal "Receive Seasonal Dispatches" newsletter box (uses the shared double-opt-in NewsletterForm). */
export function DispatchNewsletter({ source = 'blog-banner' }: { source?: string }) {
  const t = useTranslations('blog.newsletter')
  return (
    <section aria-labelledby={`newsletter-${source}-title`} className="w-full bg-surface-container-low py-space-2xl">
      <Container>
        <div className="relative overflow-hidden rounded-xl bg-primary p-space-xl text-on-primary shadow-xl lg:p-space-2xl">
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-12 -right-12 opacity-5">
            <svg fill="currentColor" height="400" viewBox="0 0 200 200" width="400">
              <path d="M100 0 C45 0 0 45 0 100 C0 155 45 200 100 200 C155 200 200 155 200 100 C200 45 155 0 100 0 Z M100 20 C144 20 180 56 180 100 C180 144 144 180 100 180 C56 180 20 144 20 100 C20 56 56 20 100 20 Z M100 40 C67 40 40 67 40 100 C40 133 67 160 100 160 C133 160 160 133 160 100 C160 67 133 40 100 40 Z" />
            </svg>
          </div>
          <div className="relative z-10 grid grid-cols-1 items-center gap-gutter-lg lg:grid-cols-12">
            <div className="flex flex-col gap-space-xs lg:col-span-7">
              <div className="flex items-center gap-space-xs">
                <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-secondary" />
                <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-primary-fixed">
                  {t('eyebrow')}
                </span>
              </div>
              <h2 id={`newsletter-${source}-title`} className="mt-1 font-headline-xl text-headline-xl text-on-primary">
                {t('title')}
              </h2>
              <p className="mt-space-xs max-w-xl font-body-lg text-body-lg leading-relaxed text-on-primary-container">
                {t('body')}
              </p>
              <div className="mt-space-sm flex flex-wrap items-center gap-space-md text-caption text-primary-fixed-dim">
                <span className="flex items-center gap-1">
                  <Icon name="verified" className="text-[16px] text-tertiary-fixed" />
                  {t('pointOne')}
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="lock" className="text-[16px] text-tertiary-fixed" />
                  {t('pointTwo')}
                </span>
              </div>
            </div>
            <div className="lg:col-span-5">
              <NewsletterForm source={source} tone="dark" labelledBy={`newsletter-${source}-title`} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
