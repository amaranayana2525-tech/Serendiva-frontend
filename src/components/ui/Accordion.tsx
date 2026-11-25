'use client'

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from './Icon'

export interface AccordionItem {
  id: string
  title: ReactNode
  content: ReactNode
}

export interface AccordionProps {
  items: AccordionItem[]
  /** Ids open on first render (the Stitch home FAQ opens the first one). */
  defaultOpen?: string[]
  /** Allow several panels open at once (default true). */
  multiple?: boolean
  /** Heading level wrapping each trigger (WAI-ARIA accordion pattern). */
  headingLevel?: 2 | 3 | 4
  className?: string
  /** Defaults reproduce the home FAQ: sand-low card, headline-sm question, cinnamon chevron. */
  itemClassName?: string
  buttonClassName?: string
  panelClassName?: string
  iconClassName?: string
  /** Icon name for the toggle (rotates 180° when open). */
  icon?: string
}

/** Accessible accordion (button + region, aria-expanded/controls, ↑/↓/Home/End between triggers). Panels stay in the DOM (crawlable). */
export function Accordion({
  items,
  defaultOpen = [],
  multiple = true,
  headingLevel = 3,
  className,
  itemClassName,
  buttonClassName,
  panelClassName,
  iconClassName,
  icon = 'expand_more',
}: AccordionProps) {
  const [open, setOpen] = useState<string[]>(defaultOpen)
  const baseId = useId()
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4'

  const toggle = (id: string) =>
    setOpen((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : multiple ? [...prev, id] : [id]))

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = items.length - 1
    const target =
      event.key === 'ArrowDown'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowUp'
          ? index === 0
            ? last
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null
    if (target === null) return
    event.preventDefault()
    buttons.current[target]?.focus()
  }

  return (
    <div className={cn('flex flex-col gap-space-sm', className)}>
      {items.map((item, index) => {
        const isOpen = open.includes(item.id)
        const buttonId = `${baseId}-trigger-${index}`
        const panelId = `${baseId}-panel-${index}`
        return (
          <div
            key={item.id}
            className={cn('overflow-hidden rounded-xl bg-surface-container-low shadow-sm', itemClassName)}
          >
            <Heading className="m-0">
              <button
                ref={(el) => {
                  buttons.current[index] = el
                }}
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                onKeyDown={(e) => onKeyDown(e, index)}
                className={cn(
                  'flex w-full items-center justify-between gap-space-md p-space-md text-left font-headline-sm text-headline-sm text-primary',
                  'rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                  buttonClassName,
                )}
              >
                <span>{item.title}</span>
                <Icon
                  name={icon}
                  className={cn(
                    'shrink-0 text-secondary transition-transform duration-200',
                    isOpen && 'rotate-180',
                    iconClassName,
                  )}
                />
              </button>
            </Heading>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className={cn(
                'px-space-md pb-space-md font-body-md text-body-md text-on-surface-variant',
                panelClassName,
              )}
            >
              {item.content}
            </div>
          </div>
        )
      })}
    </div>
  )
}
