'use client'

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { CharCount, controlInvalidClass, FieldShell } from '@/components/admin/kit/form/FieldShell'
import { insertBlock, prefixLines, wrapSelection } from '@/components/admin/kit/MarkdownEditor'
import { MediaPicker } from '@/components/admin/kit/media/MediaPicker'
import { Icon } from '@/components/ui/Icon'
import { Markdown } from '@/components/ui/Markdown'
import { cn } from '@/lib/utils'

type Mode = 'write' | 'split' | 'preview'
type Edit = { value: string; selectionStart: number; selectionEnd: number }

export interface ArticleMarkdownEditorProps {
  label: ReactNode
  value: string
  onChange: (value: string) => void
  maxLength?: number
  rows?: number
  placeholder?: string
  hint?: ReactNode
  error?: string | null
  required?: boolean
  /** `lang` of the text being edited. */
  lang?: string
  /** Locale used for alt text of inserted images. */
  altLocale?: 'en' | 'zh' | 'de'
  className?: string
}

/**
 * Markdown editor for blog articles. Same toolbar and shortcuts as the kit's MarkdownEditor, but the live preview is
 * rendered exactly like the public article page: the public `Markdown` component with the article's classes on the
 * site's sand background and body typography (the kit preview shrinks headings to fit narrow panes). Split view puts
 * editor and preview side by side (≥ 1280 px) with proportional scroll sync.
 */
export function ArticleMarkdownEditor({
  label,
  value,
  onChange,
  maxLength,
  rows = 22,
  placeholder,
  hint,
  error,
  required,
  lang,
  altLocale = 'en',
  className,
}: ArticleMarkdownEditorProps) {
  const t = useTranslations('admin.kit.markdown')
  const tb = useTranslations('adminLibrary.blog.editor')
  const ref = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<Mode>('split')
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
        const urlStart = s + text.length + 3
        return {
          value: `${v.slice(0, s)}${inserted}${v.slice(e)}`,
          selectionStart: urlStart,
          selectionEnd: urlStart + 8,
        }
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
    if (key === 'b' || key === 'i' || key === 'k') {
      e.preventDefault()
      actions[key === 'b' ? 'bold' : key === 'i' ? 'italic' : 'link']()
    }
  }

  // Keep the preview roughly at the same place as the text being edited.
  const syncScroll = () => {
    const text = ref.current
    const preview = previewRef.current
    if (!text || !preview || mode !== 'split') return
    const max = text.scrollHeight - text.clientHeight
    const ratio = max > 0 ? text.scrollTop / max : 0
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight)
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
  const modes: { key: Mode; label: string }[] = [
    { key: 'write', label: t('modes.write') },
    { key: 'split', label: t('modes.split') },
    { key: 'preview', label: t('modes.preview') },
  ]
  const lines = rows * 24 + 20

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
                  disabled={mode === 'preview'}
                  aria-label={tool.label}
                  title={tool.label}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
                >
                  <Icon name={tool.icon} className="text-[18px]" />
                </button>
              ))}
            </div>
            <div
              className="flex items-center gap-0.5 rounded-lg bg-surface-container p-0.5"
              role="group"
              aria-label={t('modesLabel')}
            >
              {modes.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  aria-pressed={mode === m.key}
                  onClick={() => setMode(m.key)}
                  className={cn(
                    'h-7 rounded-md px-2.5 font-body-md text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    m.key === 'split' && 'hidden xl:block',
                    mode === m.key
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-primary',
                    // Below 1280 px split falls back to write: show "Write" as the active mode.
                    m.key === 'write' &&
                      mode === 'split' &&
                      'max-xl:bg-surface-container-lowest max-xl:text-primary max-xl:shadow-sm',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className={cn('grid', mode === 'split' && 'xl:grid-cols-2')}>
            <textarea
              ref={ref}
              id={id}
              value={value}
              rows={rows}
              lang={lang}
              placeholder={placeholder ?? t('placeholder')}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              aria-required={required || undefined}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              onScroll={syncScroll}
              style={mode === 'split' ? { minHeight: lines } : undefined}
              className={cn(
                'block w-full resize-y bg-transparent px-3 py-2.5 font-mono text-[13px] leading-6 text-on-surface placeholder:text-outline focus:outline-none',
                mode === 'preview' && 'hidden',
                mode === 'split' && 'xl:resize-none xl:border-r xl:border-surface-container',
              )}
            />
            {mode !== 'write' && (
              <div
                ref={previewRef}
                role="region"
                aria-label={t('previewLabel')}
                // Same surface + typography as the public article page.
                className={cn(
                  'overflow-auto bg-surface px-5 py-5 font-body-lg text-on-surface md:px-8 md:py-6',
                  mode === 'split' ? 'hidden xl:block' : 'min-h-[20rem]',
                )}
                style={mode === 'split' ? { height: lines } : undefined}
              >
                <p className="mb-4 flex items-center gap-1.5 font-caption text-caption uppercase tracking-wider text-on-surface-variant">
                  <Icon name="visibility" className="text-[14px]" />
                  {tb('previewNote')}
                </p>
                {value.trim() ? (
                  <Markdown className="max-w-3xl [&_:is(h2,h3)]:scroll-mt-40 lg:[&_:is(h2,h3)]:scroll-mt-28">
                    {value}
                  </Markdown>
                ) : (
                  <p className="font-body-md text-body-md italic text-outline">{t('previewEmpty')}</p>
                )}
              </div>
            )}
          </div>
          <MediaPicker
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            folder="blog"
            onSelect={([media]) => {
              if (!media) return
              const alt = media.altText[altLocale] || media.altText.en || media.originalName || ''
              const [s, e] = savedRange ?? [value.length, value.length]
              onChange(insertBlock(value, s, e, `![${alt.replace(/[[\]]/g, '')}](${media.url})`).value)
            }}
          />
        </div>
      )}
    </FieldShell>
  )
}
