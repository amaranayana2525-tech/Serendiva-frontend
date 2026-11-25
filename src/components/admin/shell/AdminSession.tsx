'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { adminApi, unwrap } from '@/lib/admin/client'
import { useAdminQuery, type AdminQueryResult } from '@/lib/admin/hooks'
import { ADMIN_LOGIN_PATH } from '@/lib/admin/session'
import type { AdminStats, AdminUser } from '@/lib/api/types'

export interface AdminSessionValue {
  /** Signed-in admin (undefined while /auth/me loads). */
  user: AdminUser | undefined
  /** Replaces the signed-in user after an account-profile edit. */
  setUser: (user: AdminUser) => void
  /** GET /admin/stats (sidebar badges + dashboard). Invalidate with `invalidateAdminQueries('stats')`. */
  stats: AdminStats | undefined
  statsQuery: AdminQueryResult<AdminStats>
  /** POST /auth/logout then go to the login page. Resolves false when the request failed. */
  signOut: () => Promise<boolean>
  signingOut: boolean
}

const SessionContext = createContext<AdminSessionValue | null>(null)

/** Current admin user, sidebar stats and sign-out (inside the admin panel). */
export function useAdminSession(): AdminSessionValue {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useAdminSession must be used inside <AdminSessionProvider>')
  return value
}

/** Client auth bootstrap: GET /auth/me (the client refreshes or redirects to login when needed) + stats polling. */
export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const me = useAdminQuery(['me'], (signal) => unwrap(adminApi.GET('/api/v1/admin/auth/me', { signal })))
  const stats = useAdminQuery(['stats'], (signal) => unwrap(adminApi.GET('/api/v1/admin/stats', { signal })), [], {
    refetchInterval: 120_000,
  })
  const [signingOut, setSigningOut] = useState(false)

  const signOut = async () => {
    setSigningOut(true)
    try {
      const { response } = await adminApi.POST('/api/v1/admin/auth/logout')
      // 401 = the session was already gone — that's a successful sign-out too.
      if (!response.ok && response.status !== 401) {
        setSigningOut(false)
        return false
      }
    } catch {
      setSigningOut(false)
      return false
    }
    window.location.assign(ADMIN_LOGIN_PATH)
    return true
  }

  return (
    <SessionContext.Provider
      value={{
        user: me.data,
        setUser: (user) => me.setData(user),
        stats: stats.data,
        statsQuery: stats,
        signOut,
        signingOut,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}
