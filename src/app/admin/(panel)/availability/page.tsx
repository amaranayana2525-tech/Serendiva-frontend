import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AvailabilityScreen } from '@/components/admin/availability/AvailabilityScreen'
import { LoadingPanel } from '@/components/admin/kit/Panels'
import admin from '@/messages/en/admin.json'

export const metadata: Metadata = { title: admin.nav.availability }

export default function AdminAvailabilityPage() {
  return (
    <Suspense fallback={<LoadingPanel variant="cards" rows={2} />}>
      <AvailabilityScreen />
    </Suspense>
  )
}
