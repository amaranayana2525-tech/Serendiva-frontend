import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoadingPanel } from '@/components/admin/kit/Panels'
import { TourEditor } from '@/components/admin/tours/editor/TourEditor'
import adminTours from '@/messages/en/adminTours.json'

export async function generateMetadata({ params }: PageProps<'/admin/tours/[id]'>): Promise<Metadata> {
  const { id } = await params
  return { title: id === 'new' ? adminTours.editor.metaNew : adminTours.editor.metaEdit }
}

/** Tour editor — `/admin/tours/new` creates, `/admin/tours/<id>` edits (keyed so a new id remounts cleanly). */
export default async function AdminTourEditorPage({ params }: PageProps<'/admin/tours/[id]'>) {
  const { id } = await params
  return (
    <Suspense fallback={<LoadingPanel variant="form" rows={8} />}>
      <TourEditor key={id} id={id} />
    </Suspense>
  )
}
