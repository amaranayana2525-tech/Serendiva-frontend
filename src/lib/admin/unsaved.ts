'use client'

import { useEffect, useId, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { requestConfirm, type ConfirmOptions } from './confirm'

/**
 * Unsaved-changes protection:
 *  - `beforeunload` (reload, tab close, external links),
 *  - clicks on internal links anywhere in the page (sidebar, breadcrumbs, <Link>) are intercepted and confirmed,
 *  - `useAdminRouter()` = Next's router whose push/replace/back confirm first,
 *  - `confirmDiscardChanges()` for custom exits (closing a drawer or dialog with a dirty form).
 * Browser back/forward (popstate) can't be cancelled in the App Router; `beforeunload` still covers full unloads.
 */

type RouterLike = ReturnType<typeof useRouter>

const dirty = new Map<string, boolean>()
let router: RouterLike | null = null
let confirmOptions: ConfirmOptions = { title: 'Discard unsaved changes?', tone: 'danger' }
let bypassUntil = 0
let installed = false

/** True when any mounted form reported unsaved changes. */
export function hasUnsavedChanges(): boolean {
  if (Date.now() < bypassUntil) return false
  for (const value of dirty.values()) if (value) return true
  return false
}

/** Lets the next navigation through without asking (call right before navigating after a successful save). */
export function skipUnsavedCheck(ms = 1500): void {
  bypassUntil = Date.now() + ms
}

/** Asks "Discard unsaved changes?" when something is dirty. Resolves true when it's OK to leave. */
export async function confirmDiscardChanges(): Promise<boolean> {
  if (!hasUnsavedChanges()) return true
  const ok = await requestConfirm(confirmOptions)
  if (ok) skipUnsavedCheck()
  return ok
}

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!hasUnsavedChanges()) return
  event.preventDefault()
  // Legacy browsers need returnValue set.
  event.returnValue = ''
}

function onDocumentClick(event: MouseEvent) {
  if (!hasUnsavedChanges()) return
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return
  const target = event.target instanceof Element ? event.target : null
  const anchor = target?.closest('a[href]')
  if (!(anchor instanceof HTMLAnchorElement)) return
  if ((anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return
  if (anchor.dataset.skipUnsaved !== undefined) return
  const url = new URL(anchor.href, window.location.href)
  if (url.origin !== window.location.origin) return
  const samePage = url.pathname === window.location.pathname && url.search === window.location.search
  if (samePage) return
  event.preventDefault()
  event.stopPropagation()
  void confirmDiscardChanges().then((ok) => {
    if (!ok) return
    if (router && url.pathname.startsWith('/admin')) router.push(`${url.pathname}${url.search}${url.hash}`)
    else window.location.assign(url.href)
  })
}

function install() {
  if (installed || typeof window === 'undefined') return
  installed = true
  window.addEventListener('beforeunload', onBeforeUnload)
  // Capture phase on document runs before React's root listener (next/link's onClick).
  document.addEventListener('click', onDocumentClick, true)
}

function uninstall() {
  if (!installed || dirty.size > 0) return
  installed = false
  window.removeEventListener('beforeunload', onBeforeUnload)
  document.removeEventListener('click', onDocumentClick, true)
}

/**
 * Warns before leaving while `isDirty` is true (beforeunload, internal link clicks, `useAdminRouter`).
 *
 *   const { formState: { isDirty } } = useForm(...)
 *   useUnsavedChanges(isDirty && !saving)
 */
export function useUnsavedChanges(isDirty: boolean): void {
  const id = useId()
  const nextRouter = useRouter()
  const t = useTranslations('admin.kit.unsaved')
  const title = t('title')
  const body = t('body')
  const confirmLabel = t('discard')
  const cancelLabel = t('stay')

  useEffect(() => {
    router = nextRouter
    confirmOptions = { title, body, confirmLabel, cancelLabel, tone: 'danger', icon: 'warning' }
  }, [nextRouter, title, body, confirmLabel, cancelLabel])

  useEffect(() => {
    dirty.set(id, isDirty)
    install()
    return () => {
      dirty.delete(id)
      uninstall()
    }
  }, [id, isDirty])
}

/** Next.js router whose push/replace/back ask for confirmation while a form has unsaved changes. */
export function useAdminRouter(): RouterLike {
  const nextRouter = useRouter()
  return useMemo<RouterLike>(
    () => ({
      ...nextRouter,
      push: (href, options) => {
        void confirmDiscardChanges().then((ok) => ok && nextRouter.push(href, options))
      },
      replace: (href, options) => {
        void confirmDiscardChanges().then((ok) => ok && nextRouter.replace(href, options))
      },
      back: () => {
        void confirmDiscardChanges().then((ok) => ok && nextRouter.back())
      },
    }),
    [nextRouter],
  )
}
