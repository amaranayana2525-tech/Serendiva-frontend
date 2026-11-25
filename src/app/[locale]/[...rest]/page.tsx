import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common.notFound')
  return { title: t('metaTitle'), robots: { index: false, follow: true } }
}

/** Catches every unknown localised path so it renders the localised 404 (with header and footer). */
export default function CatchAllPage() {
  notFound()
}
