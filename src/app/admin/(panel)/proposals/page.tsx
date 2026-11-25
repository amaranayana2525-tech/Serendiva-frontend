import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoadingPanel } from '@/components/admin/kit/Panels'
import { ProposalsScreen } from '@/components/admin/leads/ProposalsScreen'
import admin from '@/messages/en/admin.json'

export const metadata: Metadata = { title: admin.nav.proposals }

export default function AdminProposalsPage() {
  return (
    <Suspense fallback={<LoadingPanel variant="table" />}>
      <ProposalsScreen />
    </Suspense>
  )
}
