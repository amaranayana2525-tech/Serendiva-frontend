import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { pickMessages, type Namespace } from './messages'

/**
 * Server component that provides extra message namespaces to the client components inside it
 * (the root layout only sends `common`). Nested providers replace their parent, so `common` is always included.
 *
 *   <ClientMessages namespaces={['tours']}><ToursFilter … /></ClientMessages>
 */
export async function ClientMessages({ namespaces, children }: { namespaces: Namespace[]; children: ReactNode }) {
  const messages = await getMessages()
  return (
    <NextIntlClientProvider messages={pickMessages(messages, ['common', ...namespaces])}>
      {children}
    </NextIntlClientProvider>
  )
}
