import type { Metadata } from 'next'
import { Suspense } from 'react'
import { GalleryScreen } from '@/components/admin/gallery/GalleryScreen'
import { LoadingPanel } from '@/components/admin/kit/Panels'
import admin from '@/messages/en/admin.json'

export const metadata: Metadata = { title: admin.nav.gallery }

export default function AdminGalleryPage() {
  return (
    <Suspense fallback={<LoadingPanel variant="cards" rows={8} />}>
      <GalleryScreen />
    </Suspense>
  )
}
