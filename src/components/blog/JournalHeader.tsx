import { useTranslations } from 'next-intl'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'

/** "The Serendiva Journal" masthead with the h1 and the curator vignette. */
export function JournalHeader() {
  const t = useTranslations('blog.header')
  return (
    <section aria-labelledby="journal-title" className="w-full bg-surface py-space-xl lg:py-space-2xl">
      <Container>
        <div className="grid grid-cols-1 items-end gap-gutter-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-xs lg:col-span-8">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-lg text-label-lg uppercase tracking-[0.25em] text-secondary">
                {t('eyebrow')}
              </span>
              <span aria-hidden="true" className="inline-block h-px w-8 shrink-0 bg-secondary/40" />
              <span className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
                {t('subEyebrow')}
              </span>
            </div>
            <h1 id="journal-title" className="mt-1 font-display-lg text-display-lg tracking-tight text-primary">
              {t('title')} <span className="font-display-lg font-normal italic text-secondary">{t('titleAccent')}</span>
            </h1>
            <p className="mt-space-xs max-w-2xl font-body-xl text-body-xl text-on-surface-variant">{t('intro')}</p>
          </div>
          <div className="flex flex-col items-start justify-end lg:col-span-4 lg:items-end">
            <div className="flex max-w-sm items-center gap-space-md rounded-xl bg-surface-container-high/70 p-space-md shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary shadow-md">
                <Icon name="stylus_note" className="text-[24px] text-on-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm leading-tight text-primary">
                  {t('curatorTitle')}
                </span>
                <span className="mt-0.5 font-caption text-caption text-on-surface-variant">{t('curatorBody')}</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
