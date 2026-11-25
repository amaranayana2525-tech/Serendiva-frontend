'use client'

import Image from 'next/image'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { useModalDialog } from '@/components/admin/kit/Modal'
import { Icon } from '@/components/ui/Icon'
import type { AdminStats } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import logo from '../../../../public/brand/serendiva-logo-256.png'
import { AdminSessionProvider, useAdminSession } from './AdminSession'
import { ADMIN_NAV, ADMIN_NAV_GROUPS, isNavActive, type AdminNavItem } from './nav'
import { UserMenu } from './UserMenu'

function badgeCount(item: AdminNavItem, stats: AdminStats | undefined): number {
  if (!stats || !item.badge) return 0
  if (item.badge === 'inquiries') return stats.inquiries.new
  if (item.badge === 'proposals') return stats.proposals.new
  return stats.reviews.pending
}

function Brand({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const t = useTranslations('admin.brand')
  return (
    <NextLink
      href="/admin"
      className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-fixed-dim"
    >
      <Image src={logo} alt="" width={36} height={36} className="h-9 w-9 rounded-full bg-surface" />
      <span className="flex flex-col leading-none">
        <span className={cn('font-headline-sm text-[19px] font-semibold', tone === 'light' ? 'text-on-primary' : 'text-primary')}>
          {t('name')}
        </span>
        <span
          className={cn(
            'mt-0.5 font-body-md text-[10px] font-semibold uppercase tracking-[0.2em]',
            tone === 'light' ? 'text-secondary-fixed-dim' : 'text-secondary',
          )}
        >
          {t('admin')}
        </span>
      </span>
    </NextLink>
  )
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations('admin.nav')
  const pathname = usePathname()
  const { stats } = useAdminSession()
  return (
    <nav aria-label={t('label')} className="flex flex-col gap-4">
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group} className="flex flex-col gap-0.5">
          <p className="px-3 pb-1 font-body-md text-[10px] font-semibold uppercase tracking-[0.18em] text-on-primary/50">
            {t(`groups.${group}`)}
          </p>
          <ul className="flex flex-col gap-0.5">
            {ADMIN_NAV.filter((item) => item.group === group).map((item) => {
              const active = isNavActive(item, pathname)
              const count = badgeCount(item, stats)
              return (
                <li key={item.key}>
                  <NextLink
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center gap-3 rounded-lg px-3 py-2 font-body-md text-body-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-fixed-dim',
                      active
                        ? 'bg-on-primary/10 font-semibold text-on-primary before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-secondary-fixed-dim'
                        : 'text-on-primary/75 hover:bg-on-primary/5 hover:text-on-primary',
                    )}
                  >
                    <Icon name={item.icon} filled={active} className="text-[20px]" />
                    <span className="flex-1 truncate">{t(item.key)}</span>
                    {count > 0 && (
                      <span className="min-w-[1.375rem] rounded-full bg-secondary px-1.5 py-px text-center font-body-md text-[11px] font-semibold tabular-nums text-on-secondary">
                        {count > 99 ? '99+' : count}
                        <span className="sr-only">
                          {' '}
                          {item.badge === 'reviews' ? t('badgePending', { count }) : t('badgeNew', { count })}
                        </span>
                      </span>
                    )}
                  </NextLink>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function SidebarFooter() {
  const t = useTranslations('admin.shell')
  return (
    <a
      href="/"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg px-3 py-2 font-body-md text-body-md text-on-primary/70 hover:bg-on-primary/5 hover:text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-fixed-dim"
    >
      <Icon name="open_in_new" className="text-[18px]" />
      {t('viewSite')}
      <span className="sr-only"> {t('newTab')}</span>
    </a>
  )
}

function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('admin.shell')
  const ref = useModalDialog(open)
  return (
    <dialog
      ref={ref}
      aria-label={t('menu')}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-y-0 left-0 right-auto m-0 h-dvh max-h-none w-[min(18rem,85vw)] max-w-none overflow-hidden bg-primary p-0 text-on-primary"
    >
      {open && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-3">
            <Brand />
            <button
              type="button"
              onClick={onClose}
              aria-label={t('closeMenu')}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-on-primary/80 hover:bg-on-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-fixed-dim"
            >
              <Icon name="close" className="text-[22px]" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-2">
            <SidebarNav onNavigate={onClose} />
          </div>
          <div className="border-t border-on-primary/10 px-3 py-3">
            <SidebarFooter />
          </div>
        </div>
      )}
    </dialog>
  )
}

function ShellFrame({ children }: { children: ReactNode }) {
  const t = useTranslations('admin.shell')
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="min-h-screen bg-surface-container-low lg:pl-64">
      <a
        href="#admin-main"
        className="sr-only-focusable fixed left-3 top-3 z-[60] rounded-lg bg-primary px-4 py-2 font-body-md text-body-md font-semibold text-on-primary"
      >
        {t('skipToContent')}
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-primary lg:flex">
        <div className="px-5 pb-4 pt-5">
          <Brand />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          <SidebarNav />
        </div>
        <div className="border-t border-on-primary/10 px-3 py-3">
          <SidebarFooter />
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-surface-container-high bg-surface/90 px-3 backdrop-blur-md md:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label={t('openMenu')}
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-primary hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
        >
          <Icon name="menu" className="text-[24px]" />
        </button>
        <div className="lg:hidden">
          <Brand tone="dark" />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <UserMenu />
        </div>
      </header>

      <main id="admin-main" tabIndex={-1} className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-5 focus:outline-none md:px-6 lg:px-8 lg:pt-7">
        <EmailAlertBanner />
        {children}
      </main>

      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}

/**
 * Red banner on every admin page while some leads never reached the guide's inbox (notification email failed
 * for good, e.g. a revoked Gmail App Password): the guide may not know these people are waiting for a reply.
 */
function EmailAlertBanner() {
  const t = useTranslations('admin.emailAlert')
  const { stats } = useAdminSession()
  const inquiries = stats?.emailAlerts?.inquiries ?? 0
  const proposals = stats?.emailAlerts?.proposals ?? 0
  if (inquiries + proposals === 0) return null
  return (
    <div
      role="alert"
      className="mb-5 flex flex-col gap-2 rounded-xl bg-error-container px-4 py-3 text-on-error-container md:flex-row md:items-center md:gap-4"
    >
      <Icon name="mail_lock" className="hidden text-[24px] md:block" />
      <div className="flex-1">
        <p className="font-semibold">{t('title', { count: inquiries + proposals })}</p>
        <p className="font-caption text-caption">{t('body')}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {inquiries > 0 && (
          <NextLink
            href="/admin/inquiries?guideEmail=missing"
            className="rounded-lg bg-surface-container-lowest px-3 py-1.5 font-label-md text-label-md text-error hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {t('inquiries', { count: inquiries })}
          </NextLink>
        )}
        {proposals > 0 && (
          <NextLink
            href="/admin/proposals?guideEmail=missing"
            className="rounded-lg bg-surface-container-lowest px-3 py-1.5 font-label-md text-label-md text-error hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {t('proposals', { count: proposals })}
          </NextLink>
        )}
      </div>
    </div>
  )
}

/** Admin panel frame: teal sidebar with the 13 sections (+ badges), sticky top bar with the user menu, mobile drawer. */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminSessionProvider>
      <ShellFrame>{children}</ShellFrame>
    </AdminSessionProvider>
  )
}
