'use client'

import { ErrorView } from '@/components/sections/ErrorView'

/** Last-resort boundary for the locale layout (the site chrome itself failed). */
export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorView error={error} reset={reset} />
}
