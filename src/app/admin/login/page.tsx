import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { LoginScreen } from '@/components/admin/auth/LoginScreen'
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-guard'
import { safeNextPath } from '@/lib/admin/session'
import admin from '@/messages/en/admin.json'

export const metadata: Metadata = { title: admin.login.metaTitle }

/** /admin/login — tries a silent refresh when a session cookie exists, otherwise shows the sign-in form. */
export default async function AdminLoginPage({ searchParams }: PageProps<'/admin/login'>) {
  const params = await searchParams
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next
  const next = safeNextPath(rawNext)
  const hasSession = Boolean((await cookies()).get(ADMIN_SESSION_COOKIE)?.value)
  return <LoginScreen next={next} hasSession={hasSession} />
}
