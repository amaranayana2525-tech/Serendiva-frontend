'use client'

import { ErrorView } from '@/components/sections/ErrorView'

/** Page-level error boundary — keeps the header and footer around the message. */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorView error={error} reset={reset} />
}
