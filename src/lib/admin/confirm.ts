import type { ReactNode } from 'react'

/**
 * Promise-based confirmation store. `requestConfirm({...})` resolves true/false once the user answers the dialog
 * rendered by `<ConfirmProvider />` (admin root layout). Use the `useConfirm()` hook in components.
 */

export interface ConfirmOptions {
  title: ReactNode
  body?: ReactNode
  /** Defaults to "Confirm" ("Delete" for tone="danger"). */
  confirmLabel?: string
  /** Defaults to "Cancel". */
  cancelLabel?: string
  /** 'danger' = cinnamon confirm button + warning icon (deletes, discards). */
  tone?: 'default' | 'danger'
  /** Material Symbols icon shown next to the title. */
  icon?: string
}

export interface ConfirmRequest {
  id: number
  options: ConfirmOptions
}

type Listener = () => void

let queue: { request: ConfirmRequest; resolve: (value: boolean) => void }[] = []
let nextId = 1
const listeners = new Set<Listener>()

const emit = () => {
  for (const l of listeners) l()
}

/** Opens the confirm dialog (queued if one is already open). Resolves false when no provider is mounted. */
export function requestConfirm(options: ConfirmOptions): Promise<boolean> {
  if (listeners.size === 0) return Promise.resolve(false)
  return new Promise<boolean>((resolve) => {
    queue = [...queue, { request: { id: nextId++, options }, resolve }]
    emit()
  })
}

/** Answers the currently shown request. */
export function settleConfirm(id: number, value: boolean): void {
  const entry = queue.find((q) => q.request.id === id)
  if (!entry) return
  queue = queue.filter((q) => q !== entry)
  entry.resolve(value)
  emit()
}

export function subscribeConfirm(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const getCurrentConfirm = (): ConfirmRequest | null => queue[0]?.request ?? null
export const getServerConfirm = (): ConfirmRequest | null => null
