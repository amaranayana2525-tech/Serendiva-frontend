'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import { applyFieldErrors, subscribeNewsletter } from '@/lib/api/forms'
import type { Locale } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import {
  newsletterSchema,
  toNewsletterBody,
  type NewsletterFormValues,
  type NewsletterPayload,
} from '@/lib/validation/newsletter'
import { useFieldErrorText } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { FormStatus, useFormFailureMessage, type FormStatusState } from './FormStatus'
import { Honeypot } from './Honeypot'
import { Turnstile } from './Turnstile'

export interface NewsletterFormProps {
  /** Stored as `source` (e.g. 'footer', 'blog-banner'). */
  source?: string
  /** 'footer' = Stitch footer field (white pill on sand) · 'dark' = on teal banners. */
  tone?: 'footer' | 'dark'
  /** id of a visible heading that names this form (gives in-page forms a name distinct from the footer form's). */
  labelledBy?: string
  className?: string
}

/** Double-opt-in newsletter sign-up (POST /newsletter/subscribe) styled like the Stitch footer "Join" field. */
export function NewsletterForm({ source = 'footer', tone = 'footer', labelledBy, className }: NewsletterFormProps) {
  const t = useTranslations('common')
  const locale = useLocale() as Locale
  const failureMessage = useFormFailureMessage()
  const [status, setStatus] = useState<FormStatusState>(null)
  const [attempts, setAttempts] = useState(0)
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterFormValues, unknown, NewsletterPayload>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: '', locale, source, website: '', turnstileToken: '' },
  })
  const emailError = useFieldErrorText(errors.email?.message ?? errors.root?.server?.message)

  const onSubmit = async (values: NewsletterPayload) => {
    setStatus(null)
    const result = await subscribeNewsletter(toNewsletterBody(values))
    setAttempts((n) => n + 1)
    if (result.ok) {
      setStatus({
        kind: 'success',
        title:
          result.data.status === 'already_subscribed' ? t('newsletter.alreadySubscribed') : t('newsletter.success'),
      })
      reset({ email: '', locale, source, website: '', turnstileToken: '' })
      return
    }
    if (result.kind === 'validation' && Object.keys(result.fieldErrors).length > 0)
      applyFieldErrors(setError, result.fieldErrors, ['email'])
    else setStatus({ kind: 'error', message: failureMessage(result) })
  }

  const inputId = `newsletter-email-${source}`
  const errorId = `${inputId}-error`

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      aria-label={labelledBy ? undefined : t('newsletter.label')}
      aria-labelledby={labelledBy}
      className={cn('relative flex flex-col gap-space-xs', className)}
    >
      <label htmlFor={inputId} className="sr-only">
        {t('form.labels.newsletterEmail')}
      </label>
      <div
        className={cn(
          'flex items-center gap-space-xs rounded-xl p-space-xs focus-within:ring-2 focus-within:ring-primary',
          tone === 'footer'
            ? 'bg-surface shadow-[0_1px_8px_rgba(0,0,0,0.04)]'
            : 'bg-surface/10 ring-1 ring-surface/20 focus-within:ring-surface',
          emailError && 'ring-1 ring-error',
        )}
      >
        <input
          id={inputId}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t('form.placeholders.newsletterEmail')}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? errorId : undefined}
          className={cn(
            'w-full bg-transparent px-space-md py-space-sm font-body-md text-body-md focus:outline-none coarse:min-h-11',
            tone === 'footer' ? 'text-on-surface placeholder:text-outline' : 'text-surface placeholder:text-surface/60',
          )}
          {...register('email')}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting || undefined}
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-lg px-space-md py-space-sm font-label-lg text-label-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-70 coarse:min-h-11',
            tone === 'footer'
              ? 'bg-primary text-on-primary hover:bg-primary-container focus-visible:ring-primary'
              : 'bg-secondary text-on-secondary hover:bg-on-secondary-fixed-variant focus-visible:ring-surface',
          )}
        >
          {isSubmitting && <Icon name="progress_activity" className="animate-spin text-sm" />}
          {isSubmitting ? t('buttons.sending') : t('buttons.join')}
        </button>
      </div>
      {emailError && (
        <p
          id={errorId}
          className={cn(
            'flex items-center gap-1 font-caption text-caption',
            tone === 'footer' ? 'text-error' : 'text-secondary-fixed',
          )}
        >
          <Icon name="error" className="text-sm" />
          {emailError}
        </p>
      )}
      <FormStatus state={status} />
      <Turnstile onToken={(t) => setValue('turnstileToken', t)} action="newsletter" resetKey={attempts} />
      <Honeypot {...register('website')} />
    </form>
  )
}
