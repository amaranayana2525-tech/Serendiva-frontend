'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import type { BlogHeading } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { useScrollSpy } from './useScrollSpy'

interface TocProps {
  headings: BlogHeading[]
}

function TocList({
  headings,
  activeId,
  onNavigate,
  compact = false,
}: TocProps & { activeId: string | null; onNavigate?: () => void; compact?: boolean }) {
  return (
    <ol className="flex flex-col gap-1">
      {headings.map((heading) => {
        const active = heading.id === activeId
        return (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={onNavigate}
              aria-current={active ? 'location' : undefined}
              className={cn(
                'group flex items-center justify-between gap-space-xs rounded-lg py-2 pr-space-sm transition-colors coarse:min-h-11',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                heading.level === 3
                  ? 'pl-space-lg font-body-md text-body-md'
                  : cn('pl-space-sm font-label-lg text-label-lg', compact && 'tracking-normal'),
                active
                  ? 'bg-surface-container font-bold text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-primary',
              )}
            >
              <span>{heading.text}</span>
              <Icon
                name="arrow_forward"
                className="shrink-0 text-[16px] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              />
            </a>
          </li>
        )
      })}
    </ol>
  )
}

/** Desktop sticky "In This Dispatch" card (same look as the travel-guide chapter list) with scroll-spy. */
export function ArticleTocCard({ headings }: TocProps) {
  const t = useTranslations('blog.article.toc')
  const activeId = useScrollSpy(
    headings.map((h) => h.id),
    { offset: 0.25 },
  )
  const sections = headings.filter((h) => h.level === 2).length
  return (
    <nav aria-label={t('label')} className="rounded-xl bg-surface-container-low p-space-md shadow-sm">
      <div className="mb-space-sm flex items-center justify-between gap-space-sm pb-space-sm">
        <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-on-surface-variant">
          {t('title')}
        </span>
        <span className="shrink-0 font-caption text-caption font-semibold text-secondary">
          {t('count', { count: sections || headings.length })}
        </span>
      </div>
      <TocList headings={headings} activeId={activeId} />
    </nav>
  )
}

/** Below 1024 px: a sticky, collapsible "In this dispatch" bar under the header showing the current section. */
export function ArticleTocBar({ headings }: TocProps) {
  const t = useTranslations('blog.article.toc')
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const activeId = useScrollSpy(
    headings.map((h) => h.id),
    { offset: 0.3 },
  )
  const current = headings.find((h) => h.id === activeId) ?? headings[0]

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      }
    }
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div ref={root} className="sticky top-20 z-30 w-full bg-surface/95 shadow-sm backdrop-blur-md lg:hidden">
      <Container>
        <button
          ref={button}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-space-sm rounded-lg py-space-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary coarse:min-h-11"
        >
          <span className="flex min-w-0 items-center gap-space-xs">
            <Icon name="toc" className="shrink-0 text-[20px] text-secondary" />
            <span className="shrink-0 font-label-md text-label-md uppercase tracking-widest text-secondary">
              {t('toggle')}
            </span>
            {current && (
              <span className="min-w-0 truncate font-body-md text-body-md text-primary">
                <span className="sr-only">{t('current')}: </span>
                {current.text}
              </span>
            )}
          </span>
          <Icon
            name="expand_more"
            className={cn('shrink-0 text-[22px] text-secondary transition-transform', open && 'rotate-180')}
          />
        </button>
        <nav
          id={panelId}
          aria-label={t('label')}
          hidden={!open}
          className="max-h-[60vh] overflow-y-auto border-t border-on-surface/10 py-space-sm"
        >
          <TocList headings={headings} activeId={activeId} onNavigate={() => setOpen(false)} compact />
        </nav>
      </Container>
    </div>
  )
}
