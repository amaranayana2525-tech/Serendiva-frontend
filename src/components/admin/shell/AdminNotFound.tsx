'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { Icon } from '@/components/ui/Icon'

/** "Page not found" panel for unknown admin URLs. */
export function AdminNotFound() {
  const t = useTranslations('admin.notFound')
  return (
    <div className="shadow-ambient flex flex-col items-center gap-3 rounded-xl bg-surface-container-lowest px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container text-secondary">
        <Icon name="explore_off" className="text-[28px]" />
      </span>
      <h1 className="font-headline-sm text-headline-sm text-primary">{t('title')}</h1>
      <p className="max-w-md font-body-md text-body-md text-on-surface-variant">{t('body')}</p>
      <Button href="/admin" variant="primary" icon="dashboard" className="mt-2">
        {t('back')}
      </Button>
    </div>
  )
}
