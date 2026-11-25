'use client'

import { ErrorPanel } from '@/components/admin/kit/Panels'

/** Unexpected render error inside the panel: friendly panel with "Try again" (keeps the sidebar usable). */
export default function AdminPanelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPanel error={error} onRetry={reset} />
}
