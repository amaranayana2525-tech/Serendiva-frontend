'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  runNewsletterTokenAction,
  type NewsletterTokenAction,
  type NewsletterTokenOutcome,
} from '@/lib/api/newsletter-client'
import { NewsletterForm } from '@/components/forms/NewsletterForm'
import { useSiteContact } from '@/components/layout/SiteSettingsProvider'
import { Button } from '@/components/ui/Button'
import { contactHref } from '@/lib/prefill'
import { NewsletterStatusCard, type NewsletterStatusTone } from './NewsletterStatusCard'

/**
 * One request per action/token/attempt, shared between React StrictMode's double-invoked effects and remounts —
 * a confirmation link must not be "used" twice (the second call would answer "already confirmed").
 */
const requests = new Map<string, Promise<NewsletterTokenOutcome>>()

function request(action: NewsletterTokenAction, token: string | null, attempt: number) {
  const key = `${action}:${token ?? ''}:${attempt}`
  let pending = requests.get(key)
  if (!pending) {
    pending = runNewsletterTokenAction(action, token)
    requests.set(key, pending)
  }
  return pending
}

interface ViewModel {
  tone: NewsletterStatusTone
  icon: string
  title: string
  body: string
  spinning?: boolean
  kind: 'loading' | 'success' | 'invalid' | 'retry'
}

/** Reads `?token=`, calls the API once on mount and shows the outcome. */
export function NewsletterTokenView({ action }: { action: NewsletterTokenAction }) {
  const t = useTranslations('newsletter')
  const tc = useTranslations('common')
  const contact = useSiteContact()
  const token = useSearchParams().get('token')
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: string; outcome: NewsletterTokenOutcome } | null>(null)
  const key = `${action}:${token ?? ''}:${attempt}`

  useEffect(() => {
    let active = true
    request(action, token, attempt).then((outcome) => {
      if (active) setResult({ key, outcome })
    })
    return () => {
      active = false
    }
  }, [action, token, attempt, key])

  const outcome = result?.key === key ? result.outcome : null
  const view = toViewModel(action, outcome, t)

  return (
    <NewsletterStatusCard
      eyebrow={t('eyebrow')}
      icon={view.icon}
      tone={view.tone}
      title={view.title}
      body={view.body}
      spinning={view.spinning}
      testId={`newsletter-${action}-${outcome ? (outcome.ok ? outcome.status : outcome.kind) : 'loading'}`}
    >
      {view.kind === 'success' && (
        <div className="flex flex-wrap items-center justify-center gap-space-md">
          <Button
            href={contactHref({ source: `newsletter-${action}` })}
            variant="primary"
            size="lg"
            leadingIcon="edit_calendar"
            uppercase
          >
            {t('actions.plan')}
          </Button>
          <Button href="/tours" variant="soft" size="lg" leadingIcon="travel_explore" uppercase>
            {t('actions.tours')}
          </Button>
        </div>
      )}

      {view.kind === 'retry' && (
        <div className="flex flex-wrap items-center justify-center gap-space-md">
          <Button variant="primary" size="lg" leadingIcon="refresh" uppercase onClick={() => setAttempt((n) => n + 1)}>
            {t('actions.retry')}
          </Button>
          <Button href="/" variant="soft" size="lg" leadingIcon="home" uppercase>
            {t('actions.home')}
          </Button>
        </div>
      )}

      {view.kind === 'invalid' && action === 'unsubscribe' && (
        <div className="flex flex-wrap items-center justify-center gap-space-md">
          {contact.email && (
            <Button href={`mailto:${contact.email}`} variant="primary" size="lg" leadingIcon="mail" uppercase>
              {t('actions.emailMe')}
            </Button>
          )}
          <Button href="/" variant="soft" size="lg" leadingIcon="home" uppercase>
            {t('actions.home')}
          </Button>
        </div>
      )}

      {((view.kind === 'invalid' && action === 'confirm') ||
        (outcome?.ok === true && outcome.status === 'unsubscribed')) && (
        <div className="flex w-full max-w-md flex-col gap-space-sm text-left">
          <span
            id={`newsletter-${action}-resubscribe`}
            className="text-center font-label-md text-label-md font-semibold uppercase tracking-widest text-on-surface-variant"
          >
            {t('actions.resubscribe')}
          </span>
          <NewsletterForm source={`newsletter-${action}-page`} labelledBy={`newsletter-${action}-resubscribe`} />
          <span className="text-center font-caption text-caption text-on-surface-variant">
            {tc('newsletter.privacyNote')}
          </span>
        </div>
      )}
    </NewsletterStatusCard>
  )
}

type Translator = ReturnType<typeof useTranslations<'newsletter'>>

function toViewModel(action: NewsletterTokenAction, outcome: NewsletterTokenOutcome | null, t: Translator): ViewModel {
  if (!outcome) {
    return {
      kind: 'loading',
      tone: 'pending',
      icon: 'progress_activity',
      spinning: true,
      title: t(`${action}.loading.title`),
      body: t(`${action}.loading.body`),
    }
  }
  if (outcome.ok) {
    if (outcome.status === 'already_confirmed') {
      return {
        kind: 'success',
        tone: 'neutral',
        icon: 'verified',
        title: t('confirm.already.title'),
        body: t('confirm.already.body'),
      }
    }
    if (outcome.status === 'unsubscribed') {
      return {
        kind: 'success',
        tone: 'neutral',
        icon: 'unsubscribe',
        title: t('unsubscribe.unsubscribed.title'),
        body: t('unsubscribe.unsubscribed.body'),
      }
    }
    return {
      kind: 'success',
      tone: 'success',
      icon: 'mark_email_read',
      title: t('confirm.confirmed.title'),
      body: t('confirm.confirmed.body'),
    }
  }
  switch (outcome.kind) {
    case 'invalid':
      return {
        kind: 'invalid',
        tone: 'warning',
        icon: 'link_off',
        title: t(`${action}.invalid.title`),
        body: t(`${action}.invalid.body`),
      }
    case 'network':
      return {
        kind: 'retry',
        tone: 'warning',
        icon: 'cloud_off',
        title: t('errors.network.title'),
        body: t('errors.network.body'),
      }
    case 'rate_limited':
      return {
        kind: 'retry',
        tone: 'warning',
        icon: 'hourglass_top',
        title: t('errors.rateLimited.title'),
        body: t('errors.rateLimited.body'),
      }
    case 'server':
      return {
        kind: 'retry',
        tone: 'warning',
        icon: 'error',
        title: t('errors.server.title'),
        body: t('errors.server.body'),
      }
  }
}
