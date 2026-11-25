/**
 * Tiny toast store (no provider needed to *emit*): `toast.success('Saved')` works from anywhere — hooks, event
 * handlers, plain functions. `<Toaster />` (in the admin root layout) renders the stack.
 */

export type ToastTone = 'success' | 'error' | 'info' | 'warning'

export interface ToastOptions {
  title: string
  /** Extra line(s) under the title (e.g. a list of validation errors). */
  description?: string | string[]
  tone?: ToastTone
  /** Auto-dismiss after ms (default 4 s, errors 8 s). 0 = stays until closed. */
  duration?: number
  action?: { label: string; onClick: () => void }
}

export interface ToastItem extends ToastOptions {
  id: number
  tone: ToastTone
}

type Listener = () => void

let items: ToastItem[] = []
let nextId = 1
const listeners = new Set<Listener>()
const timers = new Map<number, ReturnType<typeof setTimeout>>()
const EMPTY: ToastItem[] = []
const MAX_VISIBLE = 5

function emit() {
  for (const l of listeners) l()
}

function dismiss(id: number) {
  const timer = timers.get(id)
  if (timer) clearTimeout(timer)
  timers.delete(id)
  const before = items.length
  items = items.filter((t) => t.id !== id)
  if (items.length !== before) emit()
}

function show(options: ToastOptions): number {
  const id = nextId++
  const tone = options.tone ?? 'info'
  const item: ToastItem = { ...options, id, tone }
  items = [...items, item].slice(-MAX_VISIBLE)
  const duration = options.duration ?? (tone === 'error' ? 8000 : 4000)
  if (duration > 0 && typeof window !== 'undefined') timers.set(id, setTimeout(() => dismiss(id), duration))
  emit()
  return id
}

type Shortcut = (title: string, description?: string | string[], options?: Omit<ToastOptions, 'title' | 'tone'>) => number
const shortcut =
  (tone: ToastTone): Shortcut =>
  (title, description, options) =>
    show({ ...options, title, description, tone })

/** Imperative toast API. `useToast()` returns the same object. */
export const toast = {
  show,
  success: shortcut('success'),
  error: shortcut('error'),
  info: shortcut('info'),
  warning: shortcut('warning'),
  dismiss,
  clear() {
    for (const t of timers.values()) clearTimeout(t)
    timers.clear()
    items = []
    emit()
  },
}

export type ToastApi = typeof toast

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const getToasts = (): ToastItem[] => items
export const getServerToasts = (): ToastItem[] => EMPTY
