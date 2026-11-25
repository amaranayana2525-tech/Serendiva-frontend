import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { ConfirmProvider } from '@/components/admin/kit/ConfirmDialog'
import { Toaster } from '@/components/admin/kit/Toaster'
import admin from '@/messages/en/admin.json'
import adminContent from '@/messages/en/adminContent.json'
import adminLibrary from '@/messages/en/adminLibrary.json'
import adminTours from '@/messages/en/adminTours.json'
import common from '@/messages/en/common.json'
import { fontVariables } from '../fonts'
import '../globals.css'

export const viewport: Viewport = {
  themeColor: '#003441',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: { default: admin.meta.title, template: admin.meta.titleTemplate },
  description: admin.meta.description,
  applicationName: admin.meta.title,
  // The admin is never indexed (the proxy and next.config also send X-Robots-Tag: noindex, nofollow).
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: 'same-origin',
  formatDetection: { telephone: false, email: false, address: false },
}

/**
 * Root layout of the admin panel (separate from the localised site: English UI, own <html>). Provides the brand fonts,
 * the `admin` + `common` messages to client components, the toast stack and the confirm dialog host.
 */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-screen bg-surface-container-low font-body-md text-body-md text-on-surface antialiased">
        <NextIntlClientProvider locale="en" timeZone="Asia/Colombo" messages={{ admin, adminTours, adminContent, adminLibrary, common }}>
          {children}
          <Toaster />
          <ConfirmProvider />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
