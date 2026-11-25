'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import NextLink from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { confirmDiscardChanges } from '@/lib/admin/unsaved'
import { toast } from '@/lib/admin/toast'
import { cn, initialsOf } from '@/lib/utils'
import { useAdminSession } from './AdminSession'
import { ChangePasswordDialog } from './ChangePasswordDialog'

/** Avatar button + disclosure menu: who is signed in, change password, sign out. */
export function UserMenu() {
  const t = useTranslations('admin.shell')
  const { user, signOut, signingOut } = useAdminSession()
  const [open, setOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const name = user?.name ?? ''
  const itemClass =
    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left font-body-md text-body-md text-on-surface hover:bg-surface-container-low focus-visible:bg-surface-container-low focus-visible:outline-none'

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t('userMenu')}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-body-md text-[12px] font-semibold text-on-primary">
          {name ? initialsOf(name) : <Icon name="person" className="text-[18px]" />}
        </span>
        <span className="hidden max-w-[10rem] truncate font-body-md text-body-md font-medium text-on-surface md:inline">
          {name || t('loadingUser')}
        </span>
        <Icon name="expand_more" className={cn('text-[18px] text-on-surface-variant transition-transform', open && 'rotate-180')} />
      </button>
      <div
        id={menuId}
        hidden={!open}
        className="shadow-ambient absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-surface-container bg-surface-container-lowest p-1.5"
      >
        <div className="border-b border-surface-container px-3 pb-2.5 pt-1.5">
          <p className="font-caption text-caption text-on-surface-variant">{t('signedInAs')}</p>
          <p className="truncate font-body-md text-body-md font-semibold text-on-surface">{name || '—'}</p>
          {user?.email && <p className="truncate font-caption text-caption text-on-surface-variant">{user.email}</p>}
        </div>
        <ul className="flex flex-col pt-1.5">
          <li>
            <NextLink href="/admin/profile" className={itemClass} onClick={() => setOpen(false)}>
              <Icon name="person" className="text-[18px] text-on-surface-variant" />
              {t('profile')}
            </NextLink>
          </li>
          <li>
            <button
              type="button"
              className={itemClass}
              onClick={() => {
                setOpen(false)
                setPasswordOpen(true)
              }}
            >
              <Icon name="lock_reset" className="text-[18px] text-on-surface-variant" />
              {t('changePassword')}
            </button>
          </li>
          <li>
            <button
              type="button"
              className={itemClass}
              disabled={signingOut}
              onClick={async () => {
                if (!(await confirmDiscardChanges())) return
                setOpen(false)
                const ok = await signOut()
                if (!ok) toast.error(t('signOutFailed'))
              }}
            >
              <Icon
                name={signingOut ? 'progress_activity' : 'logout'}
                className={cn('text-[18px] text-on-surface-variant', signingOut && 'animate-spin')}
              />
              {signingOut ? t('signingOut') : t('signOut')}
            </button>
          </li>
        </ul>
      </div>
      <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  )
}
