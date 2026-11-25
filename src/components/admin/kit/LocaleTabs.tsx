'use client'

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import {
  ADMIN_LOCALES,
  localeErrors,
  type AdminLocale,
  type Translatable,
} from '@/lib/admin/translatable'
import { cn } from '@/lib/utils'
import { CharCount, FieldShell } from './form/FieldShell'
import { ShellInput } from './form/TextField'
import { ShellTextarea } from './form/TextArea'

export interface LocaleTabsProps {
  value: AdminLocale
  onChange: (locale: AdminLocale) => void
  /** Locales that have content (dot). Use `localesWithContent(...)`. */
  filled?: Partial<Record<AdminLocale, boolean>>
  /** Locales with validation errors (red dot + announced). */
  errors?: Partial<Record<AdminLocale, boolean>>
  /** Accessible name (default "Content language"). */
  label?: string
  size?: 'sm' | 'md'
  className?: string
}

/**
 * EN / 中文 / DE switch for translatable fields. EN carries a "Required" badge; a teal dot marks locales with
 * content, a red dot locales with errors. Arrow keys move between locales (radio-group semantics).
 */
export function LocaleTabs({ value, onChange, filled, errors, label, size = 'md', className }: LocaleTabsProps) {
  const t = useTranslations('admin.kit.locales')
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    let next = index
    if (delta) next = (index + delta + ADMIN_LOCALES.length) % ADMIN_LOCALES.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = ADMIN_LOCALES.length - 1
    else return
    e.preventDefault()
    onChange(ADMIN_LOCALES[next])
    refs.current[next]?.focus()
  }
  return (
    <div
      role="radiogroup"
      aria-label={label ?? t('label')}
      className={cn('inline-flex items-center gap-1 rounded-xl bg-surface-container p-1', className)}
    >
      {ADMIN_LOCALES.map((locale, index) => {
        const active = locale === value
        const hasError = Boolean(errors?.[locale])
        const hasContent = Boolean(filled?.[locale])
        return (
          <button
            key={locale}
            ref={(el) => {
              refs.current[index] = el
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(locale)}
            onKeyDown={(e) => onKeyDown(e, index)}
            title={t(`${locale}.name`)}
            className={cn(
              'relative inline-flex items-center gap-1.5 rounded-lg font-body-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              size === 'sm' ? 'h-7 px-2.5 text-[12px]' : 'h-8 px-3 text-[13px]',
              active ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary',
            )}
          >
            <span>{t(`${locale}.short`)}</span>
            <span className="sr-only">
              {' '}
              ({t(`${locale}.name`)}
              {hasContent ? `, ${t('hasContent')}` : `, ${t('empty')}`}
              {hasError ? `, ${t('hasErrors')}` : ''})
            </span>
            {locale === 'en' && (
              <span className="rounded bg-secondary-fixed px-1 py-px text-[10px] font-semibold uppercase leading-3 tracking-wide text-on-secondary-fixed-variant">
                {t('required')}
              </span>
            )}
            {(hasContent || hasError) && (
              <span
                aria-hidden="true"
                className={cn('h-1.5 w-1.5 rounded-full', hasError ? 'bg-error' : 'bg-tertiary-container')}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Local locale state for a standalone translatable field/form section. */
export function useLocaleTab(initial: AdminLocale = 'en') {
  return useState<AdminLocale>(initial)
}

export interface TranslatableTextProps {
  label: ReactNode
  value: Translatable<string> | null | undefined
  onChange: (value: Translatable<string>) => void
  /**
   * Which locale to edit (controlled by a form-wide <LocaleTabs>). Omit to render the field with its own small
   * locale switch.
   */
  locale?: AdminLocale
  /** Textarea instead of input (number = rows). */
  multiline?: boolean | number
  /** English is required (zh/de are always optional). */
  required?: boolean
  maxLength?: number
  /** "n / max" counter (needs maxLength). */
  counter?: boolean
  /** Errors per locale (e.g. `localeErrors(err.fieldErrors, 'title')`) or one message for the active locale. */
  error?: Partial<Record<AdminLocale, string>> | string | null
  hint?: ReactNode
  /** Placeholder for English; other locales show the English text as placeholder. */
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * Input/textarea for a `{ en, zh?, de? }` value — edits one locale at a time. Untranslated locales show the
 * English text as placeholder; the label carries the locale badge.
 */
export function TranslatableText({
  label,
  value,
  onChange,
  locale: controlledLocale,
  multiline = false,
  required = false,
  maxLength,
  counter = false,
  error,
  hint,
  placeholder,
  disabled,
  className,
}: TranslatableTextProps) {
  const t = useTranslations('admin.kit.locales')
  const [ownLocale, setOwnLocale] = useState<AdminLocale>('en')
  const locale = controlledLocale ?? ownLocale
  const current = value?.[locale] ?? ''
  const english = value?.en ?? ''
  const errorFor = typeof error === 'string' ? error : (error?.[locale] ?? null)
  const errorLocales =
    error && typeof error === 'object'
      ? (Object.fromEntries(ADMIN_LOCALES.map((l) => [l, Boolean(error[l])])) as Record<AdminLocale, boolean>)
      : undefined
  const filled = Object.fromEntries(ADMIN_LOCALES.map((l) => [l, Boolean(value?.[l]?.trim())])) as Record<
    AdminLocale,
    boolean
  >
  const placeholderText =
    locale === 'en' ? placeholder : english ? t('placeholderFromEnglish', { text: english.slice(0, 120) }) : placeholder
  const set = (text: string) => onChange({ ...(value ?? {}), [locale]: text })
  const rows = typeof multiline === 'number' ? multiline : 4

  return (
    <FieldShell
      label={
        <span className="inline-flex items-center gap-1.5">
          {label}
          {controlledLocale && (
            <span className="rounded bg-surface-container px-1.5 py-px font-body-md text-[11px] font-semibold text-on-surface-variant">
              {t(`${locale}.short`)}
            </span>
          )}
        </span>
      }
      required={required && locale === 'en'}
      error={errorFor}
      hint={hint}
      className={className}
      labelAside={
        <>
          {!controlledLocale && (
            <LocaleTabs value={ownLocale} onChange={setOwnLocale} filled={filled} errors={errorLocales} size="sm" />
          )}
          {counter && maxLength ? <CharCount value={current} max={maxLength} /> : null}
        </>
      }
    >
      {multiline ? (
        <ShellTextarea
          key={locale}
          value={current}
          rows={rows}
          maxLength={maxLength}
          placeholder={placeholderText}
          disabled={disabled}
          lang={locale === 'zh' ? 'zh' : locale}
          onChange={(e) => set(e.target.value)}
        />
      ) : (
        <ShellInput
          key={locale}
          value={current}
          maxLength={maxLength}
          placeholder={placeholderText}
          disabled={disabled}
          lang={locale === 'zh' ? 'zh' : locale}
          onChange={(e) => set(e.target.value)}
        />
      )}
    </FieldShell>
  )
}

export { localeErrors }
