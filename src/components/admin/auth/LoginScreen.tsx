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
const OTP_RE = /^\d{6}$/
const noop = () => () => {}

type AuthMode = 'login' | 'forgot' | 'reset'

interface FieldErrors {
  email?: string
  password?: string
  otp?: string
  newPassword?: string
  confirmPassword?: string
}

/** false during SSR and before hydration, true afterwards (no effect + setState needed). */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
}

/** Admin sign-in: silent refresh when a session cookie exists, email/password login, and email-OTP password reset. */
export function LoginScreen({ next, hasSession }: LoginScreenProps) {
  const t = useTranslations('admin.login')
  const router = useRouter()
  const [checking, setChecking] = useState(hasSession)
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
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

  const switchMode = (nextMode: AuthMode, nextInfo: string | null = null) => {
    setMode(nextMode)
    setFieldErrors({})
    setFormError(null)
    setInfoMessage(nextInfo)
    if (nextMode === 'login') {
      setOtp('')
      setNewPassword('')
      setConfirmPassword('')
    } else if (nextMode === 'forgot') {
      setPassword('')
    }
  }

  const validateEmail = (): string | undefined => {
    const trimmed = email.trim()
    if (!trimmed) return t('errors.emailRequired')
    if (!EMAIL_RE.test(trimmed)) return t('errors.emailInvalid')
    return undefined
  }

  const submitLogin = async (e: FormEvent) => {
    e.preventDefault()
    const errors: FieldErrors = {}
    const emailErr = validateEmail()
    if (emailErr) errors.email = emailErr
    if (!password) errors.password = t('errors.passwordRequired')
    setFieldErrors(errors)
    setFormError(null)
    setInfoMessage(null)
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

  const requestResetOtp = async (isResend: boolean) => {
    const emailErr = validateEmail()
    if (emailErr) {
      setFieldErrors({ email: emailErr })
      setFormError(null)
      return
    }
    setFieldErrors({})
    setFormError(null)
    if (isResend) setResending(true)
    else setSubmitting(true)
    try {
      await unwrap(adminApi.POST('/api/v1/admin/auth/forgot-password', { body: { email: email.trim() } }))
      setMode('reset')
      setInfoMessage(isResend ? t('forgot.resent') : t('forgot.resetSubtitle'))
    } catch (raw) {
      const err = toAdminApiError(raw)
      if (err.isNetworkError) setFormError(t('forgot.errors.network'))
      else if (err.status === 429) setFormError(err.message || t('forgot.errors.rateLimited'))
      else if (err.isValidationError) {
        setFieldErrors({ email: err.fieldErrors.email })
        setFormError(t('forgot.errors.validation'))
      } else setFormError(t('forgot.errors.server'))
    } finally {
      setSubmitting(false)
      setResending(false)
    }
  }

  const submitForgot = (e: FormEvent) => {
    e.preventDefault()
    void requestResetOtp(false)
  }

  const submitReset = async (e: FormEvent) => {
    e.preventDefault()
    const errors: FieldErrors = {}
    const emailErr = validateEmail()
    if (emailErr) errors.email = emailErr
    const trimmedOtp = otp.trim()
    if (!trimmedOtp) errors.otp = t('forgot.errors.otpRequired')
    else if (!OTP_RE.test(trimmedOtp)) errors.otp = t('forgot.errors.otpInvalid')
    if (newPassword.length < 12) errors.newPassword = t('forgot.errors.passwordTooShort')
    else if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) errors.newPassword = t('forgot.errors.passwordWeak')
    if (confirmPassword !== newPassword) errors.confirmPassword = t('forgot.errors.passwordMismatch')

    setFieldErrors(errors)
    setFormError(null)
    if (Object.keys(errors).length) return

    setSubmitting(true)
    try {
      await unwrap(
        adminApi.POST('/api/v1/admin/auth/reset-password', {
          body: { email: email.trim(), otp: trimmedOtp, newPassword },
        }),
      )
      setSubmitting(false)
      setPassword('')
      switchMode('login', t('resetSuccess'))
    } catch (raw) {
      const err = toAdminApiError(raw)
      setSubmitting(false)
      if (err.isNetworkError) setFormError(t('forgot.errors.network'))
      else if (err.code === 'INVALID_OTP') setFormError(t('forgot.errors.invalidOtp'))
      else if (err.status === 429) setFormError(err.message || t('forgot.errors.rateLimited'))
      else if (err.isValidationError) {
        setFieldErrors({
          email: err.fieldErrors.email,
          otp: err.fieldErrors.otp,
          newPassword: err.fieldErrors.newPassword,
        })
        setFormError(t('forgot.errors.validation'))
      } else setFormError(t('forgot.errors.server'))
    }
  }

  const heading = mode === 'forgot' ? t('forgot.title') : mode === 'reset' ? t('forgot.resetTitle') : t('title')
  const subtitle = mode === 'forgot' ? t('forgot.subtitle') : mode === 'reset' ? email.trim() : t('subtitle')

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
          <h1 className="font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">{heading}</h1>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{subtitle}</p>

          {checking ? (
            <div role="status" className="mt-8 flex items-center gap-2 text-on-surface-variant">
              <Icon name="progress_activity" className="animate-spin text-[20px] text-primary" />
              <span className="font-body-md text-body-md">{t('checking')}</span>
            </div>
          ) : mode === 'forgot' ? (
            <form
              method="post"
              noValidate
              onSubmit={submitForgot}
              className="mt-7 flex flex-col gap-4"
              aria-describedby={formError ? 'login-error' : undefined}
            >
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
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={submitting}
                disabled={!hydrated}
                icon="mail"
                className="mt-2"
              >
                {submitting ? t('forgot.sending') : t('forgot.sendCode')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="md"
                fullWidth
                icon="arrow_back"
                onClick={() => switchMode('login')}
              >
                {t('forgot.backToLogin')}
              </Button>
            </form>
          ) : mode === 'reset' ? (
            <form
              method="post"
              noValidate
              onSubmit={(e) => void submitReset(e)}
              className="mt-7 flex flex-col gap-4"
              aria-describedby={formError ? 'login-error' : undefined}
            >
              {infoMessage && (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2.5 font-body-md text-body-md text-on-surface"
                >
                  <Icon name="check_circle" className="mt-0.5 shrink-0 text-[18px] text-tertiary-container" />
                  <span>{infoMessage}</span>
                </div>
              )}
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
                label={t('forgot.otpLabel')}
                hint={t('forgot.otpHint')}
                type="text"
                name="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                required
                value={otp}
                error={fieldErrors.otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <PasswordField
                label={t('forgot.newPassword')}
                hint={t('forgot.passwordRules')}
                name="newPassword"
                autoComplete="new-password"
                required
                value={newPassword}
                error={fieldErrors.newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <PasswordField
                label={t('forgot.confirmPassword')}
                name="confirmPassword"
                autoComplete="new-password"
                required
                value={confirmPassword}
                error={fieldErrors.confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={submitting}
                disabled={!hydrated || resending}
                icon="lock_reset"
                className="mt-2"
              >
                {submitting ? t('forgot.resetting') : t('forgot.resetSubmit')}
              </Button>
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon="arrow_back"
                  onClick={() => switchMode('login')}
                >
                  {t('forgot.backToLogin')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={resending}
                  disabled={submitting}
                  onClick={() => void requestResetOtp(true)}
                >
                  {resending ? t('forgot.resending') : t('forgot.resend')}
                </Button>
              </div>
            </form>
          ) : (
            <form
              method="post"
              noValidate
              onSubmit={(e) => void submitLogin(e)}
              className="mt-7 flex flex-col gap-4"
              aria-describedby={formError ? 'login-error' : undefined}
            >
              {infoMessage && (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2.5 font-body-md text-body-md text-on-surface"
                >
                  <Icon name="check_circle" className="mt-0.5 shrink-0 text-[18px] text-tertiary-container" />
                  <span>{infoMessage}</span>
                </div>
              )}
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
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="font-body-md text-body-md font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {t('forgotLink')}
                </button>
              </div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={submitting}
                disabled={!hydrated}
                icon="login"
                className="mt-1"
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
