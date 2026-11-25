import { useTranslations } from 'next-intl'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { Icon } from '@/components/ui/Icon'

/** Stitch "Reassurance footer banner" — direct WhatsApp line to the guide. */
export function QuizContactBanner() {
  const t = useTranslations('quiz.banner')
  return (
    <section className="bg-primary px-margin py-space-xl text-on-primary md:px-margin-md lg:px-margin-lg">
      <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-space-lg md:flex-row">
        <div className="flex flex-col">
          <span className="font-label-md text-label-md uppercase tracking-widest text-on-primary-container">
            {t('eyebrow')}
          </span>
          <h2 className="mt-1 font-headline-lg text-headline-lg text-on-primary">{t('title')}</h2>
          <p className="mt-1 font-body-md text-body-md text-on-primary-container">{t('body')}</p>
        </div>
        <WhatsAppLink
          page={t('page')}
          className="inline-flex shrink-0 items-center gap-space-sm rounded-lg bg-secondary px-space-xl py-space-md font-label-lg text-label-lg text-on-secondary shadow-md transition-all hover:bg-on-secondary-fixed-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
        >
          <Icon name="chat" className="text-base" />
          <span>{t('cta')}</span>
        </WhatsAppLink>
      </div>
    </section>
  )
}
