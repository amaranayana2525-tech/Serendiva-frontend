'use client'

import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'
import { controlClass, controlInvalidClass, FieldShell } from './FieldShell'

/** Same algorithm as the API's slugify(): "Tea Mist, Monasteries & Colonial Charms" → "tea-mist-monasteries-and-colonial-charms". */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export interface SlugFieldProps {
  label?: ReactNode
  value: string
  onChange: (slug: string) => void
  /** Text the slug is generated from (usually the English title). */
  source: string
  /**
   * Keep following `source` while true. Defaults to "the slug is empty or still equals slugify(source)" so new
   * records follow the title and existing records keep their slug until the user edits it explicitly.
   */
  auto?: boolean
  /** Path prefix shown before the slug (e.g. "/tours/"). */
  prefix?: string
  hint?: ReactNode
  error?: string | null
  required?: boolean
  id?: string
  className?: string
}

/**
 * URL slug that follows the title until edited. "Edit" unlocks manual editing (input is sanitised as you type),
 * "Regenerate" re-derives it from the source.
 */
export function SlugField({
  label,
  value,
  onChange,
  source,
  auto,
  prefix,
  hint,
  error,
  required,
  id,
  className,
}: SlugFieldProps) {
  const t = useTranslations('admin.kit.slug')
  const [editing, setEditing] = useState(false)
  const generated = slugify(source)
  const following = auto ?? (!editing && (value === '' || value === generated))

  // Follow the source: when it changes and the slug still matches the previous source (or is empty), re-derive it.
  const previousSource = useRef(source)
  const onSourceChange = useEffectEvent((previous: string) => {
    if (auto === false || (editing && auto === undefined)) return
    const shouldFollow = auto === true || value === '' || value === slugify(previous)
    if (shouldFollow && generated !== value) onChange(generated)
  })
  useEffect(() => {
    const previous = previousSource.current
    previousSource.current = source
    if (previous !== source) onSourceChange(previous)
  }, [source])

  return (
    <FieldShell
      label={label ?? t('label')}
      hint={hint ?? (following ? t('autoHint') : t('manualHint'))}
      error={error ?? (value && !SLUG_PATTERN.test(value) ? t('invalid') : undefined)}
      required={required}
      id={id}
      className={className}
      labelAside={
        <div className="flex items-center gap-1">
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-caption text-caption font-semibold text-primary hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Icon name="edit" className="text-[14px]" />
              {t('edit')}
            </button>
          )}
          {generated && generated !== value && (
            <button
              type="button"
              onClick={() => onChange(generated)}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-caption text-caption font-semibold text-primary hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Icon name="refresh" className="text-[14px]" />
              {t('regenerate')}
            </button>
          )}
        </div>
      }
    >
      {({ id: controlId, describedBy, invalid }) => (
        <div
          className={cn(
            controlClass,
            'flex items-center gap-0 p-0 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25',
            !editing && 'bg-surface-container-low',
            invalid && controlInvalidClass,
          )}
        >
          {prefix && (
            <span className="shrink-0 select-none pl-3 font-body-md text-body-md text-on-surface-variant">{prefix}</span>
          )}
          <input
            id={controlId}
            value={value}
            readOnly={!editing}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            aria-required={required || undefined}
            spellCheck={false}
            autoCapitalize="off"
            onChange={(e) =>
              onChange(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]+/g, '-')
                  .replace(/-{2,}/g, '-'),
              )
            }
            onBlur={() => onChange(value.replace(/^-+|-+$/g, ''))}
            className={cn(
              'min-w-0 flex-1 rounded-lg bg-transparent py-2 font-mono text-[13px] text-on-surface focus:outline-none',
              prefix ? 'pl-0.5 pr-3' : 'px-3',
              !editing && 'cursor-default text-on-surface-variant',
            )}
          />
        </div>
      )}
    </FieldShell>
  )
}
