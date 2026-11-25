'use client'

import { useId, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Button, IconButton } from '@/components/admin/kit/Button'
import { controlClass, controlInvalidClass } from '@/components/admin/kit/form/FieldShell'
import { Repeater, type RepeaterItemHelpers } from '@/components/admin/kit/Repeater'
import { SortableList } from '@/components/admin/kit/SortableList'
import { Icon } from '@/components/ui/Icon'
import type { AdminLocale } from '@/lib/admin/translatable'
import { cn } from '@/lib/utils'
import type { LList } from './model'

/** Small locale badge used in labels ("EN", "中文", "DE"). */
export function LocaleBadge({ locale }: { locale: AdminLocale }) {
  const t = useTranslations('admin.kit.locales')
  return (
    <span className="rounded bg-surface-container px-1.5 py-px font-body-md text-[11px] font-semibold text-on-surface-variant">
      {t(`${locale}.short`)}
    </span>
  )
}

/** Inline field error used by list-level errors (picked up by the editor's "scroll to first error"). */
export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <p data-field-error="" className="flex items-start gap-1 font-caption text-caption text-error">
      <Icon name="error" className="mt-px text-[14px]" />
      <span>{message}</span>
    </p>
  )
}

export interface StringListEditorProps {
  label: ReactNode
  /** Accessible list name (plain text). */
  listLabel: string
  items: readonly string[]
  onChange: (items: string[]) => void
  max: number
  maxLength: number
  /** Placeholder per position (English value while translating). */
  placeholders?: readonly (string | undefined)[]
  addPlaceholder?: string
  hint?: ReactNode
  error?: string | null
  lang?: string
  /** Extra element right of the label (locale badge). */
  labelAside?: ReactNode
}

/**
 * Ordered list of short strings (route stops, highlights, badges): inline editing, drag/keyboard reordering, add with
 * Enter (a pasted multi-line list adds one item per line), remove.
 */
export function StringListEditor({
  label,
  listLabel,
  items,
  onChange,
  max,
  maxLength,
  placeholders,
  addPlaceholder,
  hint,
  error,
  lang,
  labelAside,
}: StringListEditorProps) {
  const t = useTranslations('adminTours.editor.list')
  const [draft, setDraft] = useState('')
  const inputId = useId()
  const full = items.length >= max
  // Stable keys for the rows (positions shift when reordering/removing).
  const [keys, setKeys] = useState<number[]>(() => items.map((_, i) => i))
  const [nextKey, setNextKey] = useState(items.length)
  let rowKeys = keys
  if (keys.length !== items.length) {
    rowKeys = items.map((_, i) => keys[i] ?? nextKey + i)
    setKeys(rowKeys)
    setNextKey(nextKey + items.length)
  }

  const add = (raw: string) => {
    const parts = raw
      .split(/\n/)
      .map((p) => p.trim().slice(0, maxLength))
      .filter(Boolean)
    if (!parts.length) return
    const room = Math.max(0, max - items.length)
    const added = parts.slice(0, room)
    if (!added.length) return
    setKeys([...rowKeys, ...added.map((_, i) => nextKey + i)])
    setNextKey(nextKey + added.length)
    onChange([...items, ...added])
    setDraft('')
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-end justify-between gap-2">
        <label htmlFor={inputId} className="inline-flex items-center gap-1.5 font-body-md text-[13px] font-semibold text-on-surface">
          {label}
          {labelAside}
        </label>
        <span className="font-caption text-caption tabular-nums text-on-surface-variant">
          {items.length} / {max}
        </span>
      </div>
      {items.length > 0 && (
        <SortableList
          items={items.map((value, index) => ({ value, key: rowKeys[index] }))}
          getKey={(item) => String(item.key)}
          label={listLabel}
          itemLabel={(item, i) => item.value || t('itemN', { n: i + 1 })}
          className="gap-1.5"
          onReorder={(next) => {
            setKeys(next.map((n) => n.key))
            onChange(next.map((n) => n.value))
          }}
          renderItem={(item, ctx) => (
            <div className="flex items-center gap-1">
              {ctx.handle}
              <label className="sr-only" htmlFor={`${inputId}-${item.key}`}>
                {t('itemLabel', { n: ctx.index + 1 })}
              </label>
              <input
                id={`${inputId}-${item.key}`}
                value={item.value}
                maxLength={maxLength}
                lang={lang}
                placeholder={placeholders?.[ctx.index] ?? ''}
                onChange={(e) => onChange(items.map((v, i) => (i === ctx.index ? e.target.value : v)))}
                className={cn(controlClass, 'py-1.5')}
              />
              <span className="hidden sm:inline-flex">{ctx.moveButtons}</span>
              <IconButton
                icon="close"
                size="sm"
                variant="danger"
                label={t('remove', { item: item.value || t('itemN', { n: ctx.index + 1 }) })}
                onClick={() => {
                  setKeys(rowKeys.filter((_, i) => i !== ctx.index))
                  onChange(items.filter((_, i) => i !== ctx.index))
                }}
              />
            </div>
          )}
        />
      )}
      <div className="flex items-center gap-1.5">
        <input
          id={inputId}
          value={draft}
          disabled={full}
          lang={lang}
          maxLength={maxLength}
          placeholder={full ? t('full') : (addPlaceholder ?? t('addPlaceholder'))}
          aria-invalid={error ? true : undefined}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault()
              add(draft)
            }
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text')
            if (text.includes('\n')) {
              e.preventDefault()
              add(`${draft}${text}`)
            }
          }}
          className={cn(controlClass, 'py-1.5', error && controlInvalidClass)}
        />
        <Button size="sm" icon="add" onClick={() => add(draft)} disabled={full || !draft.trim()}>
          {t('add')}
        </Button>
      </div>
      {error ? (
        <FieldError message={error} />
      ) : hint ? (
        <p className="font-caption text-caption text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  )
}

/**
 * Shown on the 中文/DE tab for a per-locale list that has no translation yet: the site falls back to the English list.
 * "Copy English" seeds the translation with the English items (icons kept) to overwrite.
 */
export function TranslationPrompt({
  locale,
  count,
  onCopy,
  onStartEmpty,
}: {
  locale: AdminLocale
  count: number
  onCopy: () => void
  onStartEmpty?: () => void
}) {
  const t = useTranslations('adminTours.editor.list')
  const tl = useTranslations('admin.kit.locales')
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-3 sm:flex-row sm:items-center">
      <Icon name="translate" className="hidden text-[22px] text-secondary sm:block" />
      <p className="min-w-0 flex-1 font-body-md text-body-md text-on-surface-variant">
        {t('notTranslated', { language: tl(`${locale}.name`), count })}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" icon="content_copy" onClick={onCopy}>
          {t('copyEnglish')}
        </Button>
        {onStartEmpty && (
          <Button size="sm" variant="ghost" icon="add" onClick={onStartEmpty}>
            {t('startEmpty')}
          </Button>
        )}
      </div>
    </div>
  )
}

export interface TranslatedRepeaterProps<T> {
  locale: AdminLocale
  value: LList<T>
  onChange: (value: LList<T>) => void
  label: string
  createItem: () => T
  itemLabel: (item: T, index: number, english: T | undefined) => string
  renderItem: (item: T, helpers: RepeaterItemHelpers<T>, english: T | undefined) => ReactNode
  max: number
  addLabel: string
  emptyText?: ReactNode
  error?: string | null
  collapsible?: boolean
  defaultCollapsed?: boolean
}

/**
 * A Repeater over one locale of a per-locale list (`{ en: T[], zh?: T[], de?: T[] }`). On 中文/DE with no translation
 * yet it shows the copy prompt; otherwise each item gets the English item at the same position for placeholders.
 */
export function TranslatedRepeater<T>({
  locale,
  value,
  onChange,
  label,
  createItem,
  itemLabel,
  renderItem,
  max,
  addLabel,
  emptyText,
  error,
  collapsible = true,
  defaultCollapsed = false,
}: TranslatedRepeaterProps<T>) {
  const english = value.en
  const items = value[locale]
  const set = (next: T[]) => onChange({ ...value, [locale]: next })
  if (locale !== 'en' && items.length === 0 && english.length > 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="font-body-md text-[13px] font-semibold text-on-surface">
          {label} <span className="font-normal text-on-surface-variant">({english.length})</span>
        </p>
        <TranslationPrompt
          locale={locale}
          count={english.length}
          onCopy={() => set(english.map((item) => structuredClone(item)))}
          onStartEmpty={() => set([createItem()])}
        />
        <FieldError message={error} />
      </div>
    )
  }
  return (
    <Repeater<T>
      key={locale}
      items={items}
      onChange={set}
      createItem={createItem}
      label={label}
      addLabel={addLabel}
      max={max}
      emptyText={emptyText}
      error={error}
      collapsible={collapsible}
      defaultCollapsed={defaultCollapsed}
      itemLabel={(item, index) => itemLabel(item, index, english[index])}
      renderItem={(item, helpers) => renderItem(item, helpers, english[helpers.index])}
    />
  )
}

/** Card section heading inside a tab panel (h2 + optional description and aside). */
export function EditorSection({
  title,
  description,
  aside,
  children,
  className,
  id,
}: {
  title: ReactNode
  description?: ReactNode
  aside?: ReactNode
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={cn('shadow-ambient rounded-xl bg-surface-container-lowest', className)}>
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-surface-container px-4 py-3 md:px-5">
        <div className="min-w-0">
          <h2 className="font-body-lg text-body-lg font-semibold text-primary">{title}</h2>
          {description && <p className="font-body-md text-body-md text-on-surface-variant">{description}</p>}
        </div>
        {aside}
      </header>
      <div className="flex flex-col gap-4 p-4 md:p-5">{children}</div>
    </section>
  )
}
