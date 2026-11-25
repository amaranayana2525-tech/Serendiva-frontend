import type { Metadata } from 'next'
import { Suspense } from 'react'
import { BlogListScreen } from '@/components/admin/blog/BlogListScreen'
import { LoadingPanel } from '@/components/admin/kit/Panels'
import admin from '@/messages/en/admin.json'

export const metadata: Metadata = { title: admin.nav.blog }

export default function AdminBlogPage() {
  return (
    <Suspense fallback={<LoadingPanel variant="table" />}>
      <BlogListScreen />
    </Suspense>
  )
}
