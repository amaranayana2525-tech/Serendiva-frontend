import type { Metadata } from 'next'
import { Suspense } from 'react'
import { RegionsScreen } from '@/components/admin/destinations/RegionsScreen'
import { LoadingPanel } from '@/components/admin/kit/Panels'
import content from '@/messages/en/adminContent.json'

export const metadata: Metadata = { title: content.regions.title }

export default function AdminRegionsPage() {
  return (
    <Suspense fallback={<LoadingPanel variant="table" />}>
      <RegionsScreen />
    </Suspense>
  )
}
