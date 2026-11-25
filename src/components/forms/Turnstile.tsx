'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'
import { publicEnv } from '@/lib/env'

interface TurnstileApi {
  render: (el: HTMLElement, options: Record<string, unknown>) => string
  remove: (widgetId: string) => void
  reset: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

export interface TurnstileProps {
  /** Receives the token (empty string when it expires or fails) → put it in the form's `turnstileToken`. */
  onToken: (token: string) => void
  /** Analytics label shown in the Cloudflare dashboard, e.g. 'inquiry'. */
  action?: string
  /**
   * Change it after every submit attempt (e.g. a counter): tokens are single-use, so the widget is reset and a
   * fresh token is fetched — otherwise a retry or "send another" would reuse the spent token and be rejected.
   */
  resetKey?: number | string
  className?: string
}

/**
 * Cloudflare Turnstile challenge. Renders nothing unless NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, so forms can
 * always include it: `<Turnstile onToken={(t) => setValue('turnstileToken', t)} action="inquiry" />`.
 */
export function Turnstile({ onToken, action, resetKey, className }: TurnstileProps) {
  const siteKey = publicEnv.turnstileSiteKey
  const container = useRef<HTMLDivElement>(null)
  const callback = useRef(onToken)
  const widget = useRef<string | undefined>(undefined)
  const lastReset = useRef(resetKey)

  useEffect(() => {
    callback.current = onToken
  }, [onToken])

  useEffect(() => {
    if (lastReset.current === resetKey) return
    lastReset.current = resetKey
    if (!widget.current || !window.turnstile) return
    callback.current('')
    window.turnstile.reset(widget.current)
  }, [resetKey])

  useEffect(() => {
    if (!siteKey) return
    let widgetId: string | undefined
    let cancelled = false
    const mount = () => {
      if (cancelled || widgetId || !container.current || !window.turnstile) return false
      widgetId = window.turnstile.render(container.current, {
        sitekey: siteKey,
        action,
        theme: 'light',
        callback: (token: string) => callback.current(token),
        'expired-callback': () => callback.current(''),
        'error-callback': () => callback.current(''),
      })
      widget.current = widgetId
      return true
    }
    const timer = window.setInterval(() => {
      if (mount()) window.clearInterval(timer)
    }, 250)
    mount()
    return () => {
      cancelled = true
      window.clearInterval(timer)
      if (widgetId) window.turnstile?.remove(widgetId)
      widget.current = undefined
    }
  }, [siteKey, action])

  if (!siteKey) return null
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="lazyOnload" />
      <div ref={container} className={className ?? 'min-h-[65px]'} />
    </>
  )
}
