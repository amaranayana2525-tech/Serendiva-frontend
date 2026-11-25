'use client'

import { useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { humanizeSlug } from './galleryApi'

/** Category slug → the name the public gallery uses ("wildlife" → "Wildlife & Sanctuaries"), else a humanised slug. */
export function useGalleryCategoryLabel(): (slug: string) => string {
  const t = useTranslations('adminLibrary.gallery.categories')
  return useCallback(
    (slug: string) =>
      t.has(slug as Parameters<typeof t>[0]) ? t(slug as Parameters<typeof t>[0]) : humanizeSlug(slug),
    [t],
  )
}
