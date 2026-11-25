import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DestinationsScreen } from '@/components/admin/destinations/DestinationsScreen'
import { LoadingPanel } from '@/components/admin/kit/Panels'
import admin from '@/messages/en/admin.json'

export const metadata: Metadata = { title: admin.nav.destinations }

export default function AdminDestinationsPage() {
  return (
    <Suspense fallback={<LoadingPanel variant="table" />}>
      <DestinationsScreen />
    </Suspense>
  )
}
