import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoadingPanel } from '@/components/admin/kit/Panels'
import { MediaLibraryScreen } from '@/components/admin/media/MediaLibraryScreen'
import admin from '@/messages/en/admin.json'

export const metadata: Metadata = { title: admin.nav.media }

export default function AdminMediaPage() {
  return (
    <Suspense fallback={<LoadingPanel variant="cards" rows={12} />}>
      <MediaLibraryScreen />
    </Suspense>
  )
}
