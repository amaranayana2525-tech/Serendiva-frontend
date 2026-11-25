import type { ReactNode } from 'react'
import { AdminShell } from '@/components/admin/shell/AdminShell'

/** Every signed-in admin screen: sidebar + top bar (client auth bootstrap via GET /auth/me inside AdminShell). */
export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
