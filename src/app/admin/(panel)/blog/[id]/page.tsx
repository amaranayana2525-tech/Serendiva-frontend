import type { Metadata } from 'next'
import { BlogEditorScreen } from '@/components/admin/blog/BlogEditorScreen'
import adminLibrary from '@/messages/en/adminLibrary.json'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return { title: id === 'new' ? adminLibrary.blog.editor.newTitle : adminLibrary.blog.editor.editTitle }
}

/** /admin/blog/new (create) and /admin/blog/<id> (edit). */
export default async function AdminBlogEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BlogEditorScreen id={id} />
}
