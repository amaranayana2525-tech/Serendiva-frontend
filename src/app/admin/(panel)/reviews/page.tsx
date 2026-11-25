import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoadingPanel } from '@/components/admin/kit/Panels'
import { ReviewsScreen } from '@/components/admin/reviews/ReviewsScreen'
import admin from '@/messages/en/admin.json'

export const metadata: Metadata = { title: admin.nav.reviews }

export default function AdminReviewsPage() {
  return (
    <Suspense fallback={<LoadingPanel variant="table" />}>
      <ReviewsScreen />
    </Suspense>
  )
}
