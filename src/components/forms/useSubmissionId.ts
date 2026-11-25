'use client'

import { useCallback, useRef } from 'react'

const randomId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`

/**
 * One id per form submission (sent as `clientRequestId`). It stays the same across retries — a double click or a
 * resend after a timeout reaches the API with the same id and gets the already-saved inquiry back instead of
 * creating a duplicate. Call `renew()` once a submission succeeded (the next one is a new inquiry).
 */
export function useSubmissionId() {
  const id = useRef<string | null>(null)
  const current = useCallback(() => (id.current ??= randomId()), [])
  const renew = useCallback(() => {
    id.current = null
  }, [])
  return { current, renew }
}
