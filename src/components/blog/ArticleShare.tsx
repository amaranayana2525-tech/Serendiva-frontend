'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

const pill =
  'inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest px-space-md py-2 coarse:min-h-11 font-label-md text-label-md uppercase tracking-wider text-primary shadow-sm transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'

/** Copies text to the clipboard, falling back to a hidden textarea + execCommand on older browsers. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  } catch {
    return false
  }
}

/** Share row: copy link, WhatsApp and email — plain links, no third-party scripts or trackers. */
export function ArticleShare({ url, title }: { url: string; title: string }) {
  const t = useTranslations('blog.article.share')
  const tc = useTranslations('common.a11y')
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const onCopy = async () => {
    const ok = await copyText(url)
    setState(ok ? 'copied' : 'failed')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), 2500)
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`
  const email = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(t('emailBody', { url }))}`

  return (
    <div className="flex flex-wrap items-center gap-space-sm">
      <h2 className="mr-space-xs font-label-md text-label-md uppercase tracking-[0.2em] text-on-surface-variant">
        {t('title')}
      </h2>
      <button type="button" onClick={onCopy} className={cn(pill, state === 'copied' && 'bg-tertiary-fixed')}>
        {state === 'copied' ? (
          <Icon name="check" className="text-[16px]" />
        ) : (
          <Icon name="link" className="text-[16px]" />
        )}
        {state === 'copied' ? t('copied') : t('copy')}
      </button>
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${t('whatsappLabel')} ${tc('opensInNewTab')}`}
        className={pill}
      >
        <Icon name="chat" className="text-[16px] text-tertiary-container" />
        {t('whatsapp')}
      </a>
      <a href={email} aria-label={t('emailLabel')} className={pill}>
        <Icon name="mail" className="text-[16px]" />
        {t('email')}
      </a>
      <span role="status" aria-live="polite" className="sr-only">
        {state === 'copied' ? t('copied') : state === 'failed' ? t('copyFailed') : ''}
      </span>
      {state === 'failed' && (
        <span className="font-caption text-caption text-error" aria-hidden="true">
          {t('copyFailed')}
        </span>
      )}
    </div>
  )
}
