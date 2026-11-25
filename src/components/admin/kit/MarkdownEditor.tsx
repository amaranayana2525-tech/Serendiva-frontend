'use client'

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { Markdown } from '@/components/ui/Markdown'
import { cn } from '@/lib/utils'
import { CharCount, controlInvalidClass, FieldShell } from './form/FieldShell'
import { MediaPicker } from './media/MediaPicker'

export interface MarkdownEditorProps {
  label: ReactNode
  value: string
  onChange: (value: string) => void
  maxLength?: number
  /** Textarea height in rows (default 14). */
  rows?: number
  placeholder?: string
  hint?: ReactNode
  error?: string | null
  required?: boolean
  /** Initial view: 'write', 'preview' or 'split' (split falls back to write on small screens). */
  defaultMode?: 'write' | 'preview' | 'split'
  /** Upload folder for images inserted from the media library. */
  folder?: string
  /** `lang` of the text (zh/de editing). */
  lang?: string
  disabled?: boolean
  className?: string
}

type Edit = { value: string; selectionStart: number; selectionEnd: number }

/** Wraps the selection with `before`/`after` (or inserts a placeholder that ends up selected). */
export function wrapSelection(text: string, start: number, end: number, before: string, after: string, placeholder: string): Edit {
  const selected = text.slice(start, end) || placeholder
  const value = `${text.slice(0, start)}${before}${selected}${after}${text.slice(end)}`
  return { value, selectionStart: start + before.length, selectionEnd: start + before.length + selected.length }
}

/** Prefixes every selected line (headings, lists, quotes); numbered lists count up. */
export function prefixLines(text: string, start: number, end: number, prefix: string | ((i: number) => string)): Edit {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1
  const nextBreak = text.indexOf('\n', end)
  const lineEnd = nextBreak === -1 ? text.length : nextBreak
  const block = text.slice(lineStart, lineEnd)
  const lines = block.split('\n')
  const replaced = lines
    .map((line, i) => {
      const p = typeof prefix === 'function' ? prefix(i) : prefix
      const stripped = line.replace(/^(#{1,6}\s|>\s|[-*]\s|\d+\.\s)/, '')
      return `${p}${stripped}`
    })
    .join('\n')
  const value = `${text.slice(0, lineStart)}${replaced}${text.slice(lineEnd)}`
  return { value, selectionStart: lineStart, selectionEnd: lineStart + replaced.length }
}

/** Inserts a block at the cursor on its own line(s). */
export function insertBlock(text: string, start: number, end: number, block: string): Edit {
  const before = text.slice(0, start)
  const after = text.slice(end)
  const lead = before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : ''
  const trail = after && !after.startsWith('\n') ? '\n\n' : ''
  const value = `${before}${lead}${block}${trail}${after}`
  const pos = before.length + lead.length + block.length
  return { value, selectionStart: pos, selectionEnd: pos }
}

/**
 * Markdown textarea with a toolbar (heading, bold, italic, link, lists, quote, image from the media library),
 * Write / Split / Preview modes (preview = the public `Markdown` renderer), shortcuts (⌘/Ctrl+B, I, K) and a counter.
 */
export function MarkdownEditor({
  label,
  value,
  onChange,
  maxLength,
  rows = 14,
  placeholder,
  hint,
  error,
  required,
  defaultMode = 'write',
  folder,
  lang,
  disabled,
  className,
}: MarkdownEditorProps) {
  const t = useTranslations('admin.kit.markdown')
  const ref = useRef<HTMLTextAreaElement>(null)
  const [mode, setMode] = useState(defaultMode)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [savedRange, setSavedRange] = useState<[number, number] | null>(null)

  const apply = (edit: (text: string, start: number, end: number) => Edit) => {
    const el = ref.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const next = edit(value, start, end)
    onChange(next.value)
    requestAnimationFrame(() => {
      const node = ref.current
      if (!node) return
      node.focus()
      node.setSelectionRange(next.selectionStart, next.selectionEnd)
    })
  }

  const actions = {
    heading: () => apply((v, s, e) => prefixLines(v, s, e, '## ')),
    subheading: () => apply((v, s, e) => prefixLines(v, s, e, '### ')),
    bold: () => apply((v, s, e) => wrapSelection(v, s, e, '**', '**', t('placeholders.bold'))),
    italic: () => apply((v, s, e) => wrapSelection(v, s, e, '_', '_', t('placeholders.italic'))),
    link: () =>
      apply((v, s, e) => {
        const text = v.slice(s, e) || t('placeholders.link')
        const inserted = `[${text}](https://)`
        const value = `${v.slice(0, s)}${inserted}${v.slice(e)}`
        const urlStart = s + text.length + 3
        return { value, selectionStart: urlStart, selectionEnd: urlStart + 8 }
      }),
    bullets: () => apply((v, s, e) => prefixLines(v, s, e, '- ')),
    numbers: () => apply((v, s, e) => prefixLines(v, s, e, (i) => `${i + 1}. `)),
    quote: () => apply((v, s, e) => prefixLines(v, s, e, '> ')),
    image: () => {
      const el = ref.current
      setSavedRange([el?.selectionStart ?? value.length, el?.selectionEnd ?? value.length])
      setPickerOpen(true)
    },
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey) || e.altKey) return
    const key = e.key.toLowerCase()
    if (key === 'b') {
      e.preventDefault()
      actions.bold()
    } else if (key === 'i') {
      e.preventDefault()
      actions.italic()
    } else if (key === 'k') {
      e.preventDefault()
      actions.link()
    }
  }

  const tools: { key: keyof typeof actions; icon: string; label: string }[] = [
    { key: 'heading', icon: 'title', label: t('tools.heading') },
    { key: 'subheading', icon: 'format_size', label: t('tools.subheading') },
    { key: 'bold', icon: 'format_bold', label: t('tools.bold') },
    { key: 'italic', icon: 'format_italic', label: t('tools.italic') },
    { key: 'link', icon: 'link', label: t('tools.link') },
    { key: 'bullets', icon: 'format_list_bulleted', label: t('tools.bullets') },
    { key: 'numbers', icon: 'format_list_numbered', label: t('tools.numbers') },
    { key: 'quote', icon: 'format_quote', label: t('tools.quote') },
    { key: 'image', icon: 'image', label: t('tools.image') },
  ]
  const modes = [
    { key: 'write', label: t('modes.write') },
    { key: 'split', label: t('modes.split') },
    { key: 'preview', label: t('modes.preview') },
  ] as const

  return (
    <FieldShell
      label={label}
      hint={hint ?? t('hint')}
      error={error}
      required={required}
      className={className}
      labelAside={maxLength ? <CharCount value={value} max={maxLength} /> : undefined}
    >
      {({ id, describedBy, invalid }) => (
        <div
          className={cn(
            'overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25',
            invalid && controlInvalidClass,
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-1 border-b border-surface-container bg-surface-container-low px-1.5 py-1">
            <div role="toolbar" aria-label={t('toolbar')} aria-controls={id} className="flex flex-wrap items-center">
              {tools.map((tool) => (
                <button
                  key={tool.key}
                  type="button"
                  onClick={actions[tool.key]}
                  disabled={disabled || mode === 'preview'}
                  aria-label={tool.label}
                  title={tool.label}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
                >
                  <Icon name={tool.icon} className="text-[18px]" />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-0.5 rounded-lg bg-surface-container p-0.5" role="group" aria-label={t('modesLabel')}>
              {modes.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  aria-pressed={mode === m.key}
                  onClick={() => setMode(m.key)}
                  className={cn(
                    'h-7 rounded-md px-2.5 font-body-md text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    m.key === 'split' && 'hidden lg:block',
                    mode === m.key ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className={cn('grid', mode === 'split' && 'lg:grid-cols-2')}>
            <textarea
              ref={ref}
              id={id}
              value={value}
              rows={rows}
              lang={lang}
              placeholder={placeholder ?? t('placeholder')}
              disabled={disabled}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              aria-required={required || undefined}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              className={cn(
                'block w-full resize-y bg-transparent px-3 py-2.5 font-mono text-[13px] leading-6 text-on-surface placeholder:text-outline focus:outline-none',
                mode === 'preview' && 'hidden',
                mode === 'split' && 'max-lg:block lg:border-r lg:border-surface-container',
              )}
            />
            {mode !== 'write' && (
              <div
                className={cn('min-h-[12rem] overflow-auto px-4 py-3', mode === 'split' && 'hidden lg:block')}
                aria-label={t('previewLabel')}
                role="region"
              >
                {value.trim() ? (
                  <Markdown className="text-body-md [&_h2]:text-headline-sm [&_h2]:mt-space-lg">{value}</Markdown>
                ) : (
                  <p className="font-body-md text-body-md italic text-outline">{t('previewEmpty')}</p>
                )}
              </div>
            )}
          </div>
          <MediaPicker
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            folder={folder}
            onSelect={([media]) => {
              if (!media) return
              const alt = media.altText.en ?? media.originalName ?? ''
              const [s, e] = savedRange ?? [value.length, value.length]
              const next = insertBlock(value, s, e, `![${alt.replace(/[[\]]/g, '')}](${media.url})`)
              onChange(next.value)
            }}
          />
        </div>
      )}
    </FieldShell>
  )
}
