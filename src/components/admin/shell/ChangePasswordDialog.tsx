'use client'

import { useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { PasswordField } from '@/components/admin/kit/form/PasswordField'
import { Modal } from '@/components/admin/kit/Modal'
import { adminApi, unwrap } from '@/lib/admin/client'
import { useAdminMutation } from '@/lib/admin/hooks'

export interface ChangePasswordDialogProps {
  open: boolean
  onClose: () => void
}

type Fields = 'currentPassword' | 'newPassword' | 'confirmPassword'

/** Dialog for POST /auth/change-password (min 12 chars with a letter and a digit; signs out other devices). */
export function ChangePasswordDialog({ open, onClose }: ChangePasswordDialogProps) {
  if (!open) return null
  return <ChangePasswordForm onClose={onClose} />
}

function ChangePasswordForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations('admin.password')
  const [values, setValues] = useState<Record<Fields, string>>({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({})
  const change = useAdminMutation(
    (body: { currentPassword: string; newPassword: string }) =>
      unwrap(adminApi.POST('/api/v1/admin/auth/change-password', { body })),
    {
      successToast: t('success'),
      errorToast: (err) => (err.isValidationError ? t('fixErrors') : err.message),
      onError: (err) =>
        setErrors({
          currentPassword: err.fieldErrors.currentPassword,
          newPassword: err.fieldErrors.newPassword,
        }),
      onSuccess: () => onClose(),
    },
  )

  const validate = (): Partial<Record<Fields, string>> => {
    const out: Partial<Record<Fields, string>> = {}
    if (!values.currentPassword) out.currentPassword = t('errors.currentRequired')
    if (values.newPassword.length < 12) out.newPassword = t('errors.tooShort')
    else if (!/[A-Za-z]/.test(values.newPassword) || !/\d/.test(values.newPassword)) out.newPassword = t('errors.weak')
    else if (values.newPassword === values.currentPassword) out.newPassword = t('errors.same')
    if (values.confirmPassword !== values.newPassword) out.confirmPassword = t('errors.mismatch')
    return out
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) return
    await change.mutate({ currentPassword: values.currentPassword, newPassword: values.newPassword })
  }

  const field = (name: Fields) => ({
    value: values[name],
    error: errors[name],
    onChange: (e: { target: { value: string } }) => {
      setValues((v) => ({ ...v, [name]: e.target.value }))
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
    },
  })

  return (
    <Modal
      open
      onClose={onClose}
      title={t('title')}
      description={t('description')}
      icon="lock_reset"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button variant="primary" type="submit" form="change-password-form" loading={change.pending} icon="check">
            {t('submit')}
          </Button>
        </>
      }
    >
      <form id="change-password-form" noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
        {/* Hidden username helps password managers update the right entry. */}
        <input type="text" name="username" autoComplete="username" className="hidden" readOnly tabIndex={-1} aria-hidden="true" />
        <PasswordField
          label={t('current')}
          name="currentPassword"
          autoComplete="current-password"
          required
          autoFocus
          {...field('currentPassword')}
        />
        <PasswordField
          label={t('new')}
          name="newPassword"
          autoComplete="new-password"
          required
          hint={t('rules')}
          {...field('newPassword')}
        />
        <PasswordField
          label={t('confirm')}
          name="confirmPassword"
          autoComplete="new-password"
          required
          {...field('confirmPassword')}
        />
      </form>
    </Modal>
  )
}
