import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoadingPanel } from '@/components/admin/kit/Panels'
import { SettingsScreen } from '@/components/admin/settings/SettingsScreen'
import admin from '@/messages/en/admin.json'

export const metadata: Metadata = { title: admin.nav.settings }

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<LoadingPanel variant="form" rows={8} />}>
      <SettingsScreen />
    </Suspense>
  )
}
