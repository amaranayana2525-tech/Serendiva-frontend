import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DashboardScreen } from '@/components/admin/dashboard/DashboardScreen'
import { LoadingPanel } from '@/components/admin/kit/Panels'
import admin from '@/messages/en/admin.json'

export const metadata: Metadata = { title: admin.nav.dashboard }

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<LoadingPanel variant="stats" rows={8} card={false} />}>
      <DashboardScreen />
    </Suspense>
  )
}
