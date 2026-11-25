'use client'

import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'
import { controlInvalidClass, FieldShell } from './FieldShell'

export interface TagInputProps {
  label: ReactNode
  value: readonly string[]
  onChange: (tags: string[]) => void
  /** Offered in a datalist while typing (existing tags). */
  suggestions?: readonly string[]
  placeholder?: string
  /** Max number of tags. */
  max?: number
  /** Max characters per tag. */
  maxLength?: number
  /** Case-insensitive duplicate check (default true). */
  unique?: boolean
  hint?: ReactNode
  error?: string | null
  required?: boolean
  id?: string
  className?: string
}

/** Chips input: Enter / comma / Tab adds, Backspace on empty removes the last, × removes one; paste "a, b, c" splits. */
export function TagInput({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  max,
  maxLength = 60,
  unique = true,
  hint,
  error,
  required,
  id,
  className,
}: TagInputProps) {
  const t = useTranslations('admin.kit.tags')
  const [draft, setDraft] = useState('')
  const listId = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const full = max !== undefined && value.length >= max

  const add = (raw: string) => {
    const parts = raw
      .split(/[,\n]/)
      .map((p) => p.trim().slice(0, maxLength))
      .filter(Boolean)
    if (!parts.length) return
    const next = [...value]
    for (const part of parts) {
      if (max !== undefined && next.length >= max) break
      const exists = unique ? next.some((v) => v.toLowerCase() === part.toLowerCase()) : false
      if (!exists) next.push(part)
    }
    if (next.length !== value.length) onChange(next)
    setDraft('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',' || (e.key === 'Tab' && draft.trim())) && !e.nativeEvent.isComposing) {
      if (!draft.trim()) {
        if (e.key === 'Enter') e.preventDefault()
        return
      }
      e.preventDefault()
      add(draft)
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <FieldShell
      label={label}
      hint={hint ?? t('hint')}
      error={error}
      required={required}
      id={id}
      className={className}
      labelAside={
        max !== undefined ? (
          <span className="font-caption text-caption text-on-surface-variant">
            {value.length} / {max}
          </span>
        ) : undefined
      }
    >
      {({ id: controlId, describedBy, invalid }) => (
        <div
          className={cn(
            'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25',
            invalid && controlInvalidClass,
          )}
        >
          <ul className="contents" aria-label={t('listLabel')}>
            {value.map((tag, i) => (
              <li
                key={`${tag}-${i}`}
                className="inline-flex max-w-full items-center gap-0.5 rounded-full bg-surface-container py-0.5 pl-2.5 pr-1 font-body-md text-[13px] text-primary"
              >
                <span className="truncate">{tag}</span>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                  aria-label={t('remove', { tag })}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Icon name="close" className="text-[14px]" />
                </button>
              </li>
            ))}
          </ul>
          <input
            id={controlId}
            value={draft}
            disabled={full}
            list={suggestions?.length ? listId : undefined}
            placeholder={full ? t('full') : value.length ? '' : (placeholder ?? t('placeholder'))}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            onChange={(e) => {
              const next = e.target.value
              if (next.includes(',')) add(next)
              else setDraft(next.slice(0, maxLength))
            }}
            onKeyDown={onKeyDown}
            onBlur={() => draft.trim() && add(draft)}
            onPaste={(e) => {
              const text = e.clipboardData.getData('text')
              if (/[,\n]/.test(text)) {
                e.preventDefault()
                add(`${draft}${text}`)
              }
            }}
            className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none disabled:cursor-not-allowed"
          />
          {suggestions?.length ? (
            <datalist id={listId}>
              {suggestions
                .filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()))
                .map((s) => (
                  <option key={s} value={s} />
                ))}
            </datalist>
          ) : null}
        </div>
      )}
    </FieldShell>
  )
}
