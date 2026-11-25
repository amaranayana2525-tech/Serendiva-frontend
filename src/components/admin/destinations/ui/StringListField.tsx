'use client'

import { useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button, IconButton } from '@/components/admin/kit/Button'
import { controlClass, controlInvalidClass } from '@/components/admin/kit/form/FieldShell'
import { moveItem, SortableList } from '@/components/admin/kit/SortableList'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

export interface StringListFieldProps {
  label: string
  values: readonly string[]
  onChange: (values: string[]) => void
  /** Max number of entries. */
  max?: number
  /** Max characters per entry. */
  maxLength?: number
  /** Textareas instead of inputs (number = rows). */
  multiline?: boolean | number
  /** Label of one entry for screen readers ("Paragraph"). Numbered automatically. */
  itemLabel: string
  addLabel: string
  /** Placeholder per index (e.g. the English entry while translating). */
  placeholders?: readonly (string | undefined)[]
  /** Error per index (API/client validation paths `<field>.<index>`). */
  errorAt?: (index: number) => string | undefined
  hint?: string
  emptyText?: string
  lang?: string
  className?: string
}

let seq = 0
const nextKey = () => `s${++seq}`

/**
 * Compact editable list of strings (curations, guide-note paragraphs): one input per entry with drag/keyboard
 * reordering, move buttons, remove, and "Add". Keeps stable keys so focus survives reordering.
 */
export function StringListField({
  label,
  values,
  onChange,
  max,
  maxLength,
  multiline = false,
  itemLabel,
  addLabel,
  placeholders,
  errorAt,
  hint,
  emptyText,
  lang,
  className,
}: StringListFieldProps) {
  const t = useTranslations('adminContent.common')
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [keys, setKeys] = useState<string[]>(() => values.map(() => nextKey()))
  let current = keys
  if (keys.length !== values.length) {
    current = values.map((_, i) => keys[i] ?? nextKey())
    setKeys(current)
  }
  const canAdd = max === undefined || values.length < max
  const rows = typeof multiline === 'number' ? multiline : 3
  const items = values.map((value, index) => ({ value, key: current[index] }))

  const focusEntry = (index: number) =>
    requestAnimationFrame(() => document.getElementById(`${id}-${index}`)?.focus())

  return (
    <fieldset className={cn('flex min-w-0 flex-col gap-2', className)}>
      <legend className="mb-1.5 flex w-full items-center justify-between gap-2 font-body-md text-[13px] font-semibold text-on-surface">
        <span>
          {label}
          <span className="ml-1.5 font-normal text-on-surface-variant">
            ({values.length}
            {max !== undefined ? ` / ${max}` : ''})
          </span>
        </span>
      </legend>
      {hint && <p className="-mt-1 font-caption text-caption text-on-surface-variant">{hint}</p>}
      {values.length === 0 ? (
        <p className="rounded-xl border border-dashed border-outline-variant px-4 py-4 text-center font-body-md text-body-md text-on-surface-variant">
          {emptyText ?? t('listEmpty')}
        </p>
      ) : (
        <SortableList
          items={items}
          getKey={(item) => item.key}
          label={label}
          itemLabel={(item, i) => `${itemLabel} ${i + 1}${item.value ? ` — ${item.value.slice(0, 40)}` : ''}`}
          onReorder={(next, { from, to }) => {
            setKeys(moveItem(current, from, to))
            onChange(next.map((n) => n.value))
          }}
          className="gap-1.5"
          renderItem={(item, ctx) => {
            const error = errorAt?.(ctx.index)
            const inputId = `${id}-${ctx.index}`
            const common = {
              id: inputId,
              value: item.value,
              maxLength,
              lang,
              placeholder: placeholders?.[ctx.index] ?? undefined,
              'aria-invalid': error ? true : undefined,
              'aria-describedby': error ? `${inputId}-error` : undefined,
              className: cn(controlClass, error && controlInvalidClass),
            }
            const update = (text: string) => onChange(values.map((v, i) => (i === ctx.index ? text : v)))
            return (
              <div className="flex items-start gap-1">
                <div className="pt-1">{ctx.handle}</div>
                <div className="min-w-0 flex-1">
                  <label htmlFor={inputId} className="sr-only">
                    {itemLabel} {ctx.index + 1}
                  </label>
                  {multiline ? (
                    <textarea {...common} rows={rows} onChange={(e) => update(e.target.value)} className={cn(common.className, 'resize-y leading-relaxed')} />
                  ) : (
                    <input {...common} onChange={(e) => update(e.target.value)} />
                  )}
                  {error && (
                    <p id={`${inputId}-error`} className="mt-1 flex items-start gap-1 font-caption text-caption text-error">
                      <Icon name="error" className="mt-px text-[14px]" />
                      {error}
                    </p>
                  )}
                </div>
                <span className="hidden pt-1 sm:inline-flex">{ctx.moveButtons}</span>
                <div className="pt-1">
                  <IconButton
                    icon="delete"
                    size="sm"
                    variant="danger"
                    label={t('removeEntry', { item: `${itemLabel} ${ctx.index + 1}` })}
                    onClick={() => {
                      setKeys(current.filter((_, i) => i !== ctx.index))
                      onChange(values.filter((_, i) => i !== ctx.index))
                    }}
                  />
                </div>
              </div>
            )
          }}
        />
      )}
      <div>
        <Button
          size="sm"
          icon="add"
          disabled={!canAdd}
          onClick={() => {
            setKeys([...current, nextKey()])
            onChange([...values, ''])
            focusEntry(values.length)
          }}
        >
          {addLabel}
        </Button>
        {!canAdd && max !== undefined && (
          <span className="ml-2 font-caption text-caption text-on-surface-variant">{t('maxReached', { max })}</span>
        )}
      </div>
    </fieldset>
  )
}
