'use client'

import { useTranslations } from 'next-intl'
import { GalleryField } from '@/components/admin/kit/media/GalleryField'
import { ImageField } from '@/components/admin/kit/media/ImageField'
import { EditorSection, LocaleBadge } from './fields'
import { errorUnder, LIMITS } from './model'
import type { EditorTabProps } from './types'

/** Gallery tab: cover image + gallery (reorder, per-image title/caption in the active locale). */
export function GalleryTab({ form, locale, errors, update }: EditorTabProps) {
  const t = useTranslations('adminTours.editor.gallery')
  const tf = useTranslations('adminTours.editor.fields')
  return (
    <div className="flex flex-col gap-5">
      <EditorSection title={tf('cover')} description={t('coverHint')}>
        <ImageField
          label={tf('cover')}
          value={form.cover}
          onChange={(cover) => update('cover', cover, ['coverId'])}
          folder="tours"
          error={errors.coverId}
        />
      </EditorSection>
      <EditorSection
        title={tf('gallery')}
        description={t('galleryHint')}
        aside={
          <span className="inline-flex items-center gap-1.5 font-caption text-caption text-on-surface-variant">
            {t('captionsIn')}
            <LocaleBadge locale={locale} />
          </span>
        }
      >
        <GalleryField
          label={tf('gallery')}
          value={form.gallery}
          onChange={(gallery) => update('gallery', gallery)}
          locale={locale}
          max={LIMITS.gallery}
          folder="tours"
          error={errorUnder(errors, 'gallery')}
        />
      </EditorSection>
    </div>
  )
}
