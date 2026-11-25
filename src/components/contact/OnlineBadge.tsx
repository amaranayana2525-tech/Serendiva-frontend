'use client'

import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

/** Sri Lanka is UTC+5:30 all year (no daylight saving). */
const COLOMBO_OFFSET_MINUTES = 330

/** "07:00 – 21:00 (Sri Lanka Time …)" → [420, 1260]; falls back to 07:00–21:00. */
export function parseHours(hours: string | null | undefined): [number, number] {
  const match = /(\d{1,2})[:.](\d{2})\s*[–—-]\s*(\d{1,2})[:.](\d{2})/.exec(hours ?? '')
  if (!match) return [7 * 60, 21 * 60]
  const [, h1, m1, h2, m2] = match.map(Number) as [number, number, number, number, number]
  return [h1 * 60 + m1, h2 * 60 + m2]
}

/** Whether `date` falls inside the guide's working hours (Colombo time). */
export function isWithinHours(date: Date, [open, close]: [number, number]): boolean {
  const minutes = (date.getUTCHours() * 60 + date.getUTCMinutes() + COLOMBO_OFFSET_MINUTES) % 1440
  return open <= close ? minutes >= open && minutes < close : minutes >= open || minutes < close
}

const subscribe = (onChange: () => void) => {
  const timer = window.setInterval(onChange, 60_000)
  return () => window.clearInterval(timer)
}

export interface OnlineBadgeProps {
  hours: string | null
  online: string
  away: string
  onlineLabel: string
  awayLabel: string
}

/**
 * The Stitch "● ONLINE" pill on the guide portrait — shows "Away" outside the working hours from the settings
 * (server render and first paint show "Online", then the browser's clock decides).
 */
export function OnlineBadge({ hours, online, away, onlineLabel, awayLabel }: OnlineBadgeProps) {
  const range = parseHours(hours)
  const isOnline = useSyncExternalStore(
    subscribe,
    () => isWithinHours(new Date(), range),
    () => true,
  )
  return (
    <div
      title={isOnline ? onlineLabel : awayLabel}
      className="absolute bottom-1 right-2 flex items-center gap-1 rounded-full bg-surface-container-lowest px-2 py-0.5 shadow-md"
    >
      <span
        aria-hidden="true"
        className={cn(
          'h-2.5 w-2.5 rounded-full',
          isOnline ? 'bg-emerald-500 motion-safe:animate-pulse' : 'bg-outline-variant',
        )}
      />
      <span className="font-caption text-[10px] font-bold uppercase tracking-wider text-tertiary">
        {isOnline ? online : away}
        <span className="sr-only"> — {isOnline ? onlineLabel : awayLabel}</span>
      </span>
    </div>
  )
}
