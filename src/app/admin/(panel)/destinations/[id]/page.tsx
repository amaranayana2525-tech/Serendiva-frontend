import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DestinationEditor } from '@/components/admin/destinations/DestinationEditor'
import { LoadingPanel } from '@/components/admin/kit/Panels'
import admin from '@/messages/en/admin.json'
import content from '@/messages/en/adminContent.json'

export async function generateMetadata({ params }: PageProps<'/admin/destinations/[id]'>): Promise<Metadata> {
  const { id } = await params
  return { title: id === 'new' ? content.editor.newTitle : admin.nav.destinations }
}

export default async function AdminDestinationEditorPage({ params }: PageProps<'/admin/destinations/[id]'>) {
  const { id } = await params
  return (
    <Suspense fallback={<LoadingPanel variant="form" rows={8} />}>
      <DestinationEditor id={id} />
    </Suspense>
  )
}
