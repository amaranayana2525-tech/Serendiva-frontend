'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { Card } from '@/components/admin/kit/Card'
import { TextField } from '@/components/admin/kit/form/TextField'
import { PageHeader } from '@/components/admin/kit/PageHeader'
import { LoadingPanel } from '@/components/admin/kit/Panels'
import { Icon } from '@/components/ui/Icon'
import { adminApi, unwrap } from '@/lib/admin/client'
import { useAdminMutation } from '@/lib/admin/hooks'
import type { AdminUser } from '@/lib/api/types'
import { useAdminSession } from '../shell/AdminSession'
import { ChangePasswordDialog } from '../shell/ChangePasswordDialog'

type Fields = 'name' | 'email'

/** The signed-in administrator's account identity and security settings. */
export function ProfileScreen() {
  const { user, setUser } = useAdminSession()
  if (!user) return <LoadingPanel variant="form" rows={5} />
  return <ProfileDetails key={user.id} user={user} setUser={setUser} />
}

function ProfileDetails({ user, setUser }: { user: AdminUser; setUser: (user: AdminUser) => void }) {
  const t = useTranslations('admin.profile')
  const [values, setValues] = useState<Record<Fields, string>>({ name: user.name, email: user.email })
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({})
  const [passwordOpen, setPasswordOpen] = useState(false)

  const save = useAdminMutation(
    (body: { name: string; email: string }) => unwrap(adminApi.PUT('/api/v1/admin/auth/profile', { body })),
    {
      successToast: t('saved'),
      errorToast: (error) => (error.isValidationError ? t('fixErrors') : error.message),
      onSuccess: (next) => setUser(next),
      onError: (error) => setErrors({ name: error.fieldErrors.name, email: error.fieldErrors.email }),
    },
  )

  const update = (field: Fields, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors: Partial<Record<Fields, string>> = {}
    if (!values.name.trim()) nextErrors.name = t('errors.nameRequired')
    if (!values.email.trim()) nextErrors.email = t('errors.emailRequired')
    else if (!/^\S+@\S+\.\S+$/.test(values.email)) nextErrors.email = t('errors.emailInvalid')
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    await save.mutate({ name: values.name.trim(), email: values.email.trim() })
  }

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <div className="grid max-w-4xl gap-5 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <Card
          title={t('account.title')}
          description={t('account.description')}
          icon="person"
          actions={
            <Button type="submit" form="admin-profile" variant="primary" loading={save.pending} icon="check">
              {t('save')}
            </Button>
          }
        >
          <form id="admin-profile" noValidate onSubmit={(event) => void submit(event)} className="grid gap-4 md:grid-cols-2">
            <TextField
              label={t('account.name')}
              autoComplete="name"
              required
              value={values.name}
              maxLength={120}
              error={errors.name}
              onChange={(event) => update('name', event.target.value)}
            />
            <TextField
              label={t('account.email')}
              type="email"
              autoComplete="email"
              required
              value={values.email}
              maxLength={200}
              error={errors.email}
              onChange={(event) => update('email', event.target.value)}
            />
          </form>
        </Card>

        <div className="flex flex-col gap-5">
          <Card title={t('security.title')} description={t('security.description')} icon="lock_reset">
            <Button variant="secondary" icon="lock_reset" onClick={() => setPasswordOpen(true)}>
              {t('security.action')}
            </Button>
          </Card>
          <Card title={t('siteProfile.title')} description={t('siteProfile.description')} icon="badge">
            <Link
              href="/admin/settings?section=guide"
              className="inline-flex items-center gap-1.5 font-body-md text-body-md font-semibold text-primary underline-offset-4 hover:text-secondary hover:underline"
            >
              {t('siteProfile.action')}
              <Icon name="arrow_forward" className="text-[18px]" />
            </Link>
          </Card>
        </div>
      </div>
      <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </>
  )
}
