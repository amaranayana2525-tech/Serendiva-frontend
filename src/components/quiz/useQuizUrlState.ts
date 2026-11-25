'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { parseQuizHash, serializeQuizHash, type QuizState } from '@/lib/quiz'

/** Fired right after we change the hash, so the UI updates synchronously (hashchange is dispatched later). */
const QUIZ_HASH_EVENT = 'serendiva:quiz-hash'

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  window.addEventListener('popstate', onChange)
  window.addEventListener(QUIZ_HASH_EVENT, onChange)
  return () => {
    window.removeEventListener('hashchange', onChange)
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(QUIZ_HASH_EVENT, onChange)
  }
}

const getSnapshot = () => window.location.hash
// The server (and the hydration pass) always renders step 1; the client then switches to the hash state.
const getServerSnapshot = () => ''

export type HistoryMode = 'push' | 'replace'

/**
 * Quiz state lives in the URL hash (`#step=2&party=couple…`): a refresh keeps the visitor's progress, browser
 * Back/Forward move between questions, and the static page stays cacheable (the hash never reaches the server).
 */
export function useQuizUrlState() {
  const hash = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const state = useMemo(() => parseQuizHash(hash), [hash])

  const commit = useCallback((next: QuizState, mode: HistoryMode) => {
    const fragment = `#${serializeQuizHash(next)}`
    if (fragment === window.location.hash) return
    // Native fragment navigation (never an empty hash, which would scroll to the top): it creates / replaces a
    // same-document history entry without going through Next's patched history.pushState, so it is safe even
    // when React replays a click before the router has initialised.
    if (mode === 'push') window.location.hash = fragment
    else window.location.replace(fragment)
    window.dispatchEvent(new Event(QUIZ_HASH_EVENT))
  }, [])

  return { state, commit }
}
