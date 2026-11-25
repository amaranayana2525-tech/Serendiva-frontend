'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { ICON_NAMES } from '@/components/ui/icon-names.generated'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { FieldShell } from './form/FieldShell'
import { Modal } from './Modal'

export interface IconPickerProps {
  label: ReactNode
  /** Material Symbols name ('' / null = none). */
  value: string | null
  onChange: (name: string | null) => void
  /** Allow clearing (default true). */
  clearable?: boolean
  hint?: ReactNode
  error?: string | null
  required?: boolean
  className?: string
}

const pretty = (name: string) => name.replace(/_/g, ' ')

/**
 * Icon chooser: shows the current icon; opens a searchable grid of every icon in the sprite
 * (`icon-names.generated.ts`, the same set the API accepts from the CMS allowlist).
 */
export function IconPicker({ label, value, onChange, clearable = true, hint, error, required, className }: IconPickerProps) {
  const t = useTranslations('admin.kit.iconPicker')
  const [open, setOpen] = useState(false)
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <div className="flex items-center gap-2">
          <button
            id={id}
            type="button"
            onClick={() => setOpen(true)}
            aria-describedby={describedBy}
            aria-haspopup="dialog"
            className={cn(
              'flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-left hover:border-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              invalid && 'border-error',
            )}
          >
            {value ? (
              <>
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-container text-secondary">
                  <Icon name={value} className="text-[20px]" />
                </span>
                <span className="truncate font-body-md text-body-md text-on-surface">{pretty(value)}</span>
              </>
            ) : (
              <span className="font-body-md text-body-md text-outline">{t('none')}</span>
            )}
            <span className="ml-auto font-caption text-caption font-semibold text-primary">{t('change')}</span>
          </button>
          {clearable && value && (
            <Button size="sm" variant="ghost" icon="close" onClick={() => onChange(null)} aria-label={t('clear')}>
              <span className="sr-only">{t('clear')}</span>
            </Button>
          )}
          {open && (
            <IconGridDialog
              value={value}
              onClose={() => setOpen(false)}
              onPick={(name) => {
                onChange(name)
                setOpen(false)
              }}
            />
          )}
        </div>
      )}
    </FieldShell>
  )
}

function IconGridDialog({
  value,
  onClose,
  onPick,
}: {
  value: string | null
  onClose: () => void
  onPick: (name: string) => void
}) {
  const t = useTranslations('admin.kit.iconPicker')
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s+/g, '_')
    return q ? ICON_NAMES.filter((n) => n.includes(q)) : ICON_NAMES
  }, [query])
  return (
    <Modal open onClose={onClose} title={t('title')} size="lg" bodyClassName="flex flex-col gap-3">
      <label className="relative">
        <span className="sr-only">{t('search')}</span>
        <Icon
          name="search"
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant"
        />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder', { count: ICON_NAMES.length })}
          className="block w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2 pl-9 pr-3 font-body-md text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
        />
      </label>
      <p className="font-caption text-caption text-on-surface-variant" aria-live="polite">
        {t('results', { count: results.length })}
      </p>
      <ul className="grid max-h-[50vh] grid-cols-4 gap-1.5 overflow-y-auto sm:grid-cols-6 md:grid-cols-8">
        {results.map((name) => (
          <li key={name}>
            <button
              type="button"
              onClick={() => onPick(name)}
              aria-pressed={name === value}
              title={pretty(name)}
              className={cn(
                'flex w-full flex-col items-center gap-1 rounded-lg border px-1 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                name === value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-transparent text-on-surface-variant hover:border-outline-variant hover:text-primary',
              )}
            >
              <Icon name={name} className="text-[24px]" />
              <span className="w-full truncate font-caption text-[10px] leading-3">{pretty(name)}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
