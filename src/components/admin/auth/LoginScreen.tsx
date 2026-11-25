'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { PasswordField } from '@/components/admin/kit/form/PasswordField'
import { TextField } from '@/components/admin/kit/form/TextField'
import { Icon } from '@/components/ui/Icon'
import { adminApi, unwrap } from '@/lib/admin/client'
import { toAdminApiError } from '@/lib/admin/errors'
import { adminSession } from '@/lib/admin/session'
import logo from '../../../../public/brand/serendiva-logo-256.png'

export interface LoginScreenProps {
  /** Validated redirect target after sign-in (from ?next=). */
  next: string
  /** An sd_session cookie exists → try a silent refresh first. */
  hasSession: boolean
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const noop = () => () => {}

/** false during SSR and before hydration, true afterwards (no effect + setState needed). */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
}

/** Admin sign-in: silent refresh when a session cookie exists, then email/password with clear error messages. */
export function LoginScreen({ next, hasSession }: LoginScreenProps) {
  const t = useTranslations('admin.login')
  const router = useRouter()
  const [checking, setChecking] = useState(hasSession)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const alertRef = useRef<HTMLDivElement>(null)
  // Until React has hydrated, a native submit would put the password in the URL — keep the button disabled.
  const hydrated = useHydrated()

  // Silent refresh (shared single-flight, so React StrictMode's double effect never rotates the token twice).
  useEffect(() => {
    if (!hasSession) return
    let cancelled = false
    void adminSession.refresh().then((ok) => {
      if (cancelled) return
      if (ok) router.replace(next)
      else setChecking(false)
    })
    return () => {
      cancelled = true
    }
  }, [hasSession, next, router])

  useEffect(() => {
    if (formError) alertRef.current?.focus()
  }, [formError])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errors: { email?: string; password?: string } = {}
    if (!email.trim()) errors.email = t('errors.emailRequired')
    else if (!EMAIL_RE.test(email.trim())) errors.email = t('errors.emailInvalid')
    if (!password) errors.password = t('errors.passwordRequired')
    setFieldErrors(errors)
    setFormError(null)
    if (Object.keys(errors).length) return

    setSubmitting(true)
    try {
      await unwrap(adminApi.POST('/api/v1/admin/auth/login', { body: { email: email.trim(), password } }))
      adminSession.reset()
      router.replace(next)
    } catch (raw) {
      const err = toAdminApiError(raw)
      setSubmitting(false)
      setPassword('')
      if (err.isNetworkError) setFormError(t('errors.network'))
      else if (err.status === 401) setFormError(t('errors.invalid'))
      else if (err.code === 'ACCOUNT_LOCKED') setFormError(err.message || t('errors.locked'))
      else if (err.status === 429) setFormError(err.message || t('errors.rateLimited'))
      else if (err.isValidationError) {
        setFieldErrors({ email: err.fieldErrors.email, password: err.fieldErrors.password })
        setFormError(t('errors.validation'))
      } else setFormError(t('errors.server'))
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="shadow-ambient grid w-full max-w-4xl overflow-hidden rounded-2xl bg-surface-container-lowest md:grid-cols-[1fr_1.1fr]">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-on-primary md:flex">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-container/70 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-secondary/25 blur-3xl"
          />
          <div className="relative flex items-center gap-3">
            <Image src={logo} alt="" width={48} height={48} className="h-12 w-12 rounded-full bg-surface" priority />
            <div className="flex flex-col leading-none">
              <span className="font-headline-sm text-[22px] font-semibold">{t('brand')}</span>
              <span className="mt-1 font-body-md text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary-fixed-dim">
                {t('brandSub')}
              </span>
            </div>
          </div>
          <div className="relative">
            <p className="font-headline-md text-headline-md italic text-on-primary">{t('tagline')}</p>
            <p className="mt-3 font-body-md text-body-md text-on-primary/70">{t('taglineBody')}</p>
          </div>
        </div>

        <div className="flex flex-col justify-center px-6 py-10 sm:px-10">
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <Image src={logo} alt="" width={40} height={40} className="h-10 w-10 rounded-full" priority />
            <span className="font-headline-sm text-headline-sm text-primary">{t('brand')}</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">{t('title')}</h1>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{t('subtitle')}</p>

          {checking ? (
            <div role="status" className="mt-8 flex items-center gap-2 text-on-surface-variant">
              <Icon name="progress_activity" className="animate-spin text-[20px] text-primary" />
              <span className="font-body-md text-body-md">{t('checking')}</span>
            </div>
          ) : (
            <form
              method="post"
              noValidate
              onSubmit={(e) => void submit(e)}
              className="mt-7 flex flex-col gap-4" aria-describedby={formError ? 'login-error' : undefined}>
              {formError && (
                <div
                  ref={alertRef}
                  id="login-error"
                  role="alert"
                  tabIndex={-1}
                  className="flex items-start gap-2 rounded-lg border border-error/30 bg-error-container/60 px-3 py-2.5 font-body-md text-body-md text-on-error-container focus:outline-none"
                >
                  <Icon name="error" className="mt-0.5 text-[18px]" />
                  <span>{formError}</span>
                </div>
              )}
              <TextField
                label={t('email')}
                type="email"
                name="email"
                autoComplete="username"
                inputMode="email"
                autoFocus
                required
                value={email}
                error={fieldErrors.email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <PasswordField
                label={t('password')}
                name="password"
                autoComplete="current-password"
                required
                value={password}
                error={fieldErrors.password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={submitting}
                disabled={!hydrated}
                icon="login"
                className="mt-2"
              >
                {submitting ? t('submitting') : t('submit')}
              </Button>
              <p className="font-caption text-caption text-on-surface-variant">{t('help')}</p>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
