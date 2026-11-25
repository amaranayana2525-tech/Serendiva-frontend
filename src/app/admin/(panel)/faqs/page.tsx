import type { Metadata } from 'next'
import { Suspense } from 'react'
import { FaqsScreen } from '@/components/admin/faqs/FaqsScreen'
import { LoadingPanel } from '@/components/admin/kit/Panels'
import admin from '@/messages/en/admin.json'

export const metadata: Metadata = { title: admin.nav.faqs }

export default function AdminFaqsPage() {
  return (
    <Suspense fallback={<LoadingPanel variant="table" />}>
      <FaqsScreen />
    </Suspense>
  )
}
