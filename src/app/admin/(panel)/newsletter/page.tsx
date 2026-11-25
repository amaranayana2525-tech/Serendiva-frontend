import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoadingPanel } from '@/components/admin/kit/Panels'
import { NewsletterScreen } from '@/components/admin/newsletter/NewsletterScreen'
import admin from '@/messages/en/admin.json'

export const metadata: Metadata = { title: admin.nav.newsletter }

export default function AdminNewsletterPage() {
  return (
    <Suspense fallback={<LoadingPanel variant="table" />}>
      <NewsletterScreen />
    </Suspense>
  )
}
