import { AdminNotFound } from '@/components/admin/shell/AdminNotFound'

/** 404 for admin URLs outside the panel layout. */
export default function AdminRootNotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24">
      <AdminNotFound />
    </main>
  )
}
