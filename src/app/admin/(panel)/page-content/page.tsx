import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoadingPanel } from '@/components/admin/kit/Panels'
import { PageContentScreen } from '@/components/admin/page-content/PageContentScreen'
import admin from '@/messages/en/admin.json'

export const metadata: Metadata = { title: admin.nav.pageContent }

export default function AdminPageContentPage() {
  return (
    <Suspense fallback={<LoadingPanel variant="form" rows={8} />}>
      <PageContentScreen />
    </Suspense>
  )
}
