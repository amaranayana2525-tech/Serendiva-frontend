import { getTranslations } from 'next-intl/server'
import { ClientMessages } from '@/i18n/ClientMessages'
import { getAllTours, getSettings } from '@/lib/api/public'
import type { Locale, PublicSettings, TourCard } from '@/lib/api/types'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { ErrorState } from '@/components/ui/ErrorState'
import { Icon } from '@/components/ui/Icon'
import { QUIZ_IMAGE_SLOTS, type QuizGuide, type QuizImages } from './quiz-config'
import { QuizWizard } from './QuizWizard'

function pickImages(settings: PublicSettings | null): QuizImages {
  const images: QuizImages = {}
  if (!settings) return images
  for (const slot of QUIZ_IMAGE_SLOTS) {
    const image = settings.pageImages[slot]
    if (image) images[slot] = image
  }
  return images
}

function pickGuide(settings: PublicSettings | null): QuizGuide | null {
  if (!settings) return null
  const { name, title, licenseNumber, yearsGuiding, portrait } = settings.guide
  return { name, title, licenseNumber, yearsGuiding, portrait }
}

/**
 * Data for the wizard: every published tour (scored in the browser) + the quiz page images and guide profile.
 * Tours are required; settings are optional (cards fall back to the sand placeholder).
 */
export async function QuizWizardSection({ locale }: { locale: Locale }) {
  const [toursResult, settingsResult] = await Promise.allSettled([getAllTours(locale), getSettings(locale)])

  if (toursResult.status === 'rejected') {
    console.error('[trip-quiz] tours unavailable:', toursResult.reason)
    const t = await getTranslations({ locale, namespace: 'common' })
    const tq = await getTranslations({ locale, namespace: 'quiz' })
    return (
      <section className="px-margin pb-space-2xl md:px-margin-md lg:px-margin-lg">
        <div className="mx-auto max-w-[1180px]">
          <ErrorState
            retryHref="/trip-quiz"
            action={
              <WhatsAppLink
                page={tq('banner.page')}
                className="inline-flex items-center gap-space-xs rounded-lg bg-tertiary-container px-space-lg py-space-sm font-label-lg text-label-lg text-on-tertiary transition-colors hover:bg-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 coarse:min-h-11"
              >
                <Icon name="chat" className="text-[18px]" />
                {t('buttons.chatWhatsApp')}
              </WhatsAppLink>
            }
          />
        </div>
      </section>
    )
  }

  const settings = settingsResult.status === 'fulfilled' ? settingsResult.value : null
  if (settingsResult.status === 'rejected') console.error('[trip-quiz] settings unavailable:', settingsResult.reason)
  const tours: TourCard[] = toursResult.value

  return (
    <ClientMessages namespaces={['quiz']}>
      <QuizWizard tours={tours} images={pickImages(settings)} guide={pickGuide(settings)} />
    </ClientMessages>
  )
}
