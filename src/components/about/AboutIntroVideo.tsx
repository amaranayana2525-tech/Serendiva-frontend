import { useTranslations } from 'next-intl'
import type { PublicSettings } from '@/lib/api/types'
import { Icon } from '@/components/ui/Icon'
import { guideName, pageImage } from './guide'
import { IntroVideoPlayer } from './IntroVideoPlayer'

/** Stitch "Video Introduction Block" — lite embed of settings.guide.introVideoUrl. */
export function AboutIntroVideo({ settings }: { settings: PublicSettings | null }) {
  const t = useTranslations('about.video')
  const tc = useTranslations('common')
  const name = guideName(settings) || tc('header.meetGuide')
  const poster = pageImage(settings, 'guide-video-intro-poster', settings?.guide.candid, settings?.guide.portrait)
  return (
    <section className="w-full bg-surface-container-high py-space-3xl">
      <div className="mx-auto max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg">
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl bg-surface shadow-xl lg:grid-cols-12">
          <IntroVideoPlayer
            videoUrl={settings?.guide.introVideoUrl ?? null}
            poster={poster}
            playLabel={t('play', { name })}
            frameTitle={t('frameTitle', { name })}
            badge={t('badge')}
            comingSoon={t('comingSoon')}
          />
          <div className="flex flex-col justify-center gap-space-md p-space-xl lg:col-span-5">
            <span className="font-label-md text-label-md font-semibold uppercase tracking-widest text-secondary">
              {t('eyebrow')}
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary">{t('title', { name })}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">{t('body')}</p>
            <div className="flex flex-wrap items-center gap-space-md pt-space-sm">
              <div className="flex items-center gap-1 text-tertiary">
                <Icon name="volume_up" className="text-sm" />
                <span className="font-label-md text-label-md font-semibold">{t('audio')}</span>
              </div>
              <span aria-hidden="true" className="text-outline-variant">
                •
              </span>
              <span className="font-caption text-caption text-on-surface-variant">{t('subtitles')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
