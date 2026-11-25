'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toAdminApiError, type AdminApiError } from '@/lib/admin/errors'

export interface OrderItem {
  id: string
  order: number
}

export interface OrderSaverOptions {
  /** Called after the LAST queued order was stored. */
  onSaved?: () => void
  /** Called when a save failed (refetch the list there to restore the server order). */
  onError?: (error: AdminApiError) => void
}

/**
 * Serialises drag & drop order saves (PATCH …/order): a move made while a request is in flight is queued and only the
 * latest order is sent afterwards, so quick keyboard moves can never be stored out of order.
 */
export function useOrderSaver(save: (items: OrderItem[]) => Promise<unknown>, options: OrderSaverOptions = {}) {
  const [saving, setSaving] = useState(false)
  const inflight = useRef(false)
  const pending = useRef<OrderItem[] | null>(null)
  const saveRef = useRef(save)
  const optionsRef = useRef(options)
  useEffect(() => {
    saveRef.current = save
    optionsRef.current = options
  })

  const run = useCallback(async (first: OrderItem[]): Promise<void> => {
    inflight.current = true
    setSaving(true)
    let items: OrderItem[] | null = first
    let failed = false
    while (items && !failed) {
      try {
        await saveRef.current(items)
      } catch (error) {
        failed = true
        optionsRef.current.onError?.(toAdminApiError(error))
      }
      items = pending.current
      pending.current = null
    }
    inflight.current = false
    setSaving(false)
    if (!failed) optionsRef.current.onSaved?.()
  }, [])

  const schedule = useCallback(
    (items: OrderItem[]) => {
      if (inflight.current) pending.current = items
      else void run(items)
    },
    [run],
  )

  return { schedule, saving }
}

/** Items in their new visual order → `{ id, order }` with consecutive positions starting at `offset`. */
export function toOrderItems<T extends { id: string }>(items: readonly T[], offset = 0): OrderItem[] {
  return items.map((item, index) => ({ id: item.id, order: offset + index }))
}
