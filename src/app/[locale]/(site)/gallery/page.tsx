import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import {
  GalleryArchiveBar,
  GalleryCta,
  GalleryFilms,
  GalleryHero,
  GalleryInstagram,
  GalleryPlatesSection,
} from '@/components/gallery/GallerySections'
import { loadGallery } from '@/components/gallery/data'
import { ClientMessages } from '@/i18n/ClientMessages'
import type { Locale } from '@/i18n/routing'
import { getSettings } from '@/lib/api/public'
import type { PublicSettings } from '@/lib/api/types'
import { buildMetadata } from '@/lib/seo'

async function loadSettings(locale: Locale): Promise<PublicSettings | null> {
  try {
    return await getSettings(locale)
  } catch (error) {
    console.error('[gallery] settings unavailable:', error instanceof Error ? error.message : error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps<'/[locale]/gallery'>): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = raw as Locale
  const t = await getTranslations({ locale, namespace: 'gallery' })
  const cover = await loadGallery(locale)
    .then((g) => g.images[0]?.image ?? null)
    .catch(() => null)
  return buildMetadata({
    locale,
    path: '/gallery',
    title: t('meta.title'),
    description: t('meta.description'),
    image: cover,
  })
}

export default async function GalleryPage({ params }: PageProps<'/[locale]/gallery'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const settings = await loadSettings(locale)

  return (
    <ClientMessages namespaces={['gallery']}>
      <GalleryArchiveBar />
      <GalleryHero locale={locale} />
      <GalleryPlatesSection locale={locale} />
      <GalleryFilms locale={locale} />
      <GalleryInstagram settings={settings} />
      <GalleryCta />
    </ClientMessages>
  )
}
