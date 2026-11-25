'use client'

import type { ReactNode } from 'react'
import { LazyMotion, domAnimation, m, useReducedMotion } from 'motion/react'

const elements = { div: m.div, section: m.section, article: m.article, li: m.li, ul: m.ul, span: m.span } as const

export interface RevealProps {
  children: ReactNode
  as?: keyof typeof elements
  /** Seconds before the animation starts (stagger cards with index * 0.08). */
  delay?: number
  /** Start offset in px (fade-up distance). */
  y?: number
  className?: string
  id?: string
}

/**
 * Subtle fade-up when the element scrolls into view (once). Respects prefers-reduced-motion (JS + CSS) and
 * stays visible without JavaScript (<noscript> rule in the root layout). Never wrap the hero / LCP element.
 */
export function Reveal({ children, as = 'div', delay = 0, y = 24, className, id }: RevealProps) {
  const reduce = useReducedMotion()
  const Component = elements[as]
  return (
    <LazyMotion features={domAnimation} strict>
      <Component
        id={id}
        data-reveal=""
        className={className}
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={reduce ? { duration: 0 } : { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </Component>
    </LazyMotion>
  )
}
