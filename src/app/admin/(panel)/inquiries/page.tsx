import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoadingPanel } from '@/components/admin/kit/Panels'
import { InquiriesScreen } from '@/components/admin/leads/InquiriesScreen'
import admin from '@/messages/en/admin.json'

export const metadata: Metadata = { title: admin.nav.inquiries }

export default function AdminInquiriesPage() {
  return (
    <Suspense fallback={<LoadingPanel variant="table" />}>
      <InquiriesScreen />
    </Suspense>
  )
}
