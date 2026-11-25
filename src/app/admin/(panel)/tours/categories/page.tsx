import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoadingPanel } from '@/components/admin/kit/Panels'
import { CategoriesScreen } from '@/components/admin/tours/categories/CategoriesScreen'
import adminTours from '@/messages/en/adminTours.json'

export const metadata: Metadata = { title: adminTours.categories.metaTitle }

export default function AdminTourCategoriesPage() {
  return (
    <Suspense fallback={<LoadingPanel variant="table" />}>
      <CategoriesScreen />
    </Suspense>
  )
}
