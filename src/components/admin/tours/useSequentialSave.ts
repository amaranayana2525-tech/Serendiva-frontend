'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface SequentialSaveCallbacks<T> {
  run: (value: T) => Promise<unknown>
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

/**
 * Saves the latest value of something that changes in bursts (drag-to-reorder): one request at a time, and while one
 * is in flight only the newest pending value is sent next — so the server never ends up with an older order.
 */
export function useSequentialSave<T>(callbacks: SequentialSaveCallbacks<T>) {
  const latest = useRef(callbacks)
  useEffect(() => {
    latest.current = callbacks
  })
  const queue = useRef<{ busy: boolean; next: { value: T } | null }>({ busy: false, next: null })
  const [saving, setSaving] = useState(false)

  const push = useCallback((value: T) => {
    const q = queue.current
    q.next = { value }
    if (q.busy) return
    q.busy = true
    setSaving(true)
    void (async () => {
      let failed = false
      while (q.next) {
        const { value: current } = q.next
        q.next = null
        try {
          await latest.current.run(current)
        } catch (error) {
          failed = true
          q.next = null
          latest.current.onError?.(error)
        }
      }
      q.busy = false
      setSaving(false)
      if (!failed) latest.current.onSuccess?.()
    })()
  }, [])

  return { push, saving }
}
