'use client'

import { useEffect, useRef, useState } from 'react'

export interface CountUpProps {
  /** Counter as delivered by the API, e.g. "2,400+", "14+", "5.0★" or a number. Non-numeric text is kept. */
  value: string | number
  durationMs?: number
  className?: string
}

interface Parsed {
  prefix: string
  target: number
  decimals: number
  grouping: boolean
  suffix: string
}

function parse(value: string | number): Parsed | null {
  const text = String(value)
  const match = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(text)
  if (!match) return null
  const [, prefix = '', num = '', suffix = ''] = match
  const target = Number(num.replace(/,/g, ''))
  if (!Number.isFinite(target)) return null
  return { prefix, target, decimals: num.split('.')[1]?.length ?? 0, grouping: num.includes(','), suffix }
}

const format = (n: number, p: Parsed) =>
  `${p.prefix}${n.toLocaleString('en-US', { minimumFractionDigits: p.decimals, maximumFractionDigits: p.decimals, useGrouping: p.grouping })}${p.suffix}`

/**
 * Animated counter for the trust strip. Server HTML contains the final value (SEO / no-JS); the count-up only runs
 * when the element scrolls into view from below and motion is allowed. Screen readers always get the final value.
 */
export function CountUp({ value, durationMs = 1600, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const parsed = parse(value)
  const finalText = parsed ? format(parsed.target, parsed) : String(value)
  const [display, setDisplay] = useState(finalText)

  useEffect(() => {
    const el = ref.current
    if (!el || !parsed || parsed.target === 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    let first = true
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (first) {
          first = false
          // Already visible on load → keep the static value (no flash).
          if (entry.isIntersecting) {
            observer.disconnect()
            return
          }
          setDisplay(format(0, parsed))
          return
        }
        if (!entry.isIntersecting) return
        observer.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / durationMs)
          const eased = 1 - Math.pow(1 - progress, 3)
          setDisplay(format(parsed.target * eased, parsed))
          if (progress < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `parsed` is derived from `value`
  }, [value, durationMs])

  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true">{display}</span>
      <span className="sr-only">{finalText}</span>
    </span>
  )
}
