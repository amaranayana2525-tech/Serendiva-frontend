'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { LanguageSwitcher } from './LanguageSwitcher'
import { isActivePath, PRIMARY_NAV, SECONDARY_NAV } from './nav'
import { useWhatsAppHref } from './SiteSettingsProvider'

/**
 * Hamburger + slide-in drawer for < xl screens (the Stitch export has no mobile menu; it reuses header styles).
 * Native modal <dialog>: focus trap, Esc to close, page inert, focus returns to the trigger.
 */
export function MobileNav({ className }: { className?: string }) {
  const t = useTranslations('common')
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const dialogId = useId()
  const whatsappHref = useWhatsAppHref({ ignorePageContext: false })

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
    document.documentElement.style.overflow = open ? 'hidden' : ''
  }, [open])

  const close = () => setOpen(false)

  return (
    <>
      <button
        type="button"
        aria-label={t('header.openMenu')}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => setOpen(true)}
        className={cn(
          'tap-target relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface xl:hidden',
          className,
        )}
      >
        <Icon name="menu" className="text-[18px]" />
      </button>

      <dialog
        id={dialogId}
        ref={dialogRef}
        data-drawer=""
        aria-label={t('header.menuTitle')}
        onClose={close}
        onCancel={(e) => {
          e.preventDefault()
          close()
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
        className="fixed inset-y-0 left-auto right-0 m-0 h-[100dvh] max-h-none w-[min(88vw,400px)] max-w-none overflow-y-auto bg-surface p-0 text-on-surface shadow-2xl backdrop:bg-primary/40 backdrop:backdrop-blur-[8px]"
      >
        <div className="flex min-h-full flex-col">
          <div className="flex h-20 items-center justify-between border-b border-surface-container px-margin">
            <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary">
              {t('header.menuTitle')}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label={t('header.closeMenu')}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container text-primary transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Icon name="close" className="text-xl" />
            </button>
          </div>

          <nav aria-label={t('header.primaryNav')} className="px-margin py-space-md">
            <ul className="flex flex-col">
              {PRIMARY_NAV.map((item) => {
                const active = isActivePath(pathname, item.href)
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={close}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center justify-between rounded-lg px-space-md py-3 font-headline-sm text-headline-sm transition-colors hover:bg-surface-container',
                        active ? 'bg-surface-container-low text-primary' : 'font-medium text-on-surface-variant',
                      )}
                    >
                      {t(`nav.${item.key}`)}
                      {active && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-secondary" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="px-margin pb-space-md">
            <p className="px-space-md pb-space-xs font-label-md text-label-md uppercase tracking-widest text-secondary">
              {t('header.moreTitle')}
            </p>
            <ul className="grid grid-cols-2 gap-1">
              {SECONDARY_NAV.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={isActivePath(pathname, item.href) ? 'page' : undefined}
                    className="block rounded-lg px-space-md py-space-sm font-body-md text-body-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface aria-[current=page]:font-semibold aria-[current=page]:text-primary"
                  >
                    {t(`nav.${item.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="px-margin pb-space-md">
            <p className="px-space-md pb-space-xs font-label-md text-label-md uppercase tracking-widest text-secondary">
              {t('languageSwitcher.label')}
            </p>
            <LanguageSwitcher variant="list" />
          </div>

          <div className="mt-auto flex flex-col gap-space-sm border-t border-surface-container bg-surface-container-low px-margin py-space-lg">
            <Link
              href="/contact"
              onClick={close}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-space-lg py-3 font-label-lg text-label-lg text-on-secondary shadow-[0_4px_16px_rgba(156,68,30,0.2)] transition-all hover:bg-on-secondary-fixed-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Icon name="edit_calendar" className="text-[18px]" />
              {t('header.planMyTrip')}
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-tertiary-container px-space-lg py-3 font-label-lg text-label-lg text-on-tertiary transition-colors hover:bg-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Icon name="chat" className="text-[18px]" />
              {t('buttons.chatWhatsApp')}
              <span className="sr-only"> {t('a11y.opensInNewTab')}</span>
            </a>
          </div>
        </div>
      </dialog>
    </>
  )
}
