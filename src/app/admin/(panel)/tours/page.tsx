import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoadingPanel } from '@/components/admin/kit/Panels'
import { ToursScreen } from '@/components/admin/tours/ToursScreen'
import admin from '@/messages/en/admin.json'

export const metadata: Metadata = { title: admin.nav.tours }

export default function AdminToursPage() {
  return (
    <Suspense fallback={<LoadingPanel variant="table" />}>
      <ToursScreen />
    </Suspense>
  )
}
