'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import {
  getCurrentConfirm,
  getServerConfirm,
  requestConfirm,
  settleConfirm,
  subscribeConfirm,
  type ConfirmOptions,
} from '@/lib/admin/confirm'
import { Button } from './Button'
import { Modal } from './Modal'

export interface ConfirmDialogProps {
  open: boolean
  title: ReactNode
  body?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  icon?: string
  /** Shows a spinner on the confirm button (when the dialog itself runs the action). */
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Controlled confirmation dialog (most code uses the promise-based `useConfirm()` instead). */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = 'default',
  icon,
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const t = useTranslations('admin.kit.confirm')
  const danger = tone === 'danger'
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      icon={icon ?? (danger ? 'warning' : 'help')}
      iconTone={danger ? 'danger' : 'default'}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} autoFocus={danger}>
            {cancelLabel ?? t('cancel')}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={busy} autoFocus={!danger}>
            {confirmLabel ?? (danger ? t('delete') : t('confirm'))}
          </Button>
        </>
      }
    >
      {body ? <div className="font-body-md text-body-md text-on-surface-variant">{body}</div> : undefined}
    </Modal>
  )
}

/** Renders the dialog for `useConfirm()` requests. Mount once (admin root layout). */
export function ConfirmProvider() {
  const current = useSyncExternalStore(subscribeConfirm, getCurrentConfirm, getServerConfirm)
  if (!current) return null
  const { id, options } = current
  return (
    <ConfirmDialog
      key={id}
      open
      title={options.title}
      body={options.body}
      confirmLabel={options.confirmLabel}
      cancelLabel={options.cancelLabel}
      tone={options.tone}
      icon={options.icon}
      onConfirm={() => settleConfirm(id, true)}
      onCancel={() => settleConfirm(id, false)}
    />
  )
}

/**
 * Promise-based confirm: `if (await confirm({ title: 'Delete this inquiry?', tone: 'danger' })) …`.
 * Resolves false when cancelled (Esc, backdrop, Cancel).
 */
export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  return requestConfirm
}
