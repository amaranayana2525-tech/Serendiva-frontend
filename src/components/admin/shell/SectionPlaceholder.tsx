'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { PageHeader } from '@/components/admin/kit/PageHeader'
import { Icon } from '@/components/ui/Icon'
import { ADMIN_NAV, type AdminSectionKey } from './nav'

/** Friendly "This section is being built" page for sidebar sections whose screens don't exist yet. */
export function SectionPlaceholder({ section }: { section: Exclude<AdminSectionKey, 'dashboard' | 'inquiries' | 'proposals' | 'pageContent'> }) {
  const t = useTranslations('admin.placeholder')
  const nav = useTranslations('admin.nav')
  const icon = ADMIN_NAV.find((item) => item.key === section)?.icon ?? 'construction'
  return (
    <>
      <PageHeader title={nav(section)} breadcrumbs={[{ label: nav('dashboard'), href: '/admin' }, { label: nav(section) }]} />
      <div className="shadow-ambient flex flex-col items-center gap-3 rounded-xl bg-surface-container-lowest px-6 py-16 text-center">
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-surface-container text-secondary">
          <Icon name={icon} className="text-[32px]" />
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-secondary-fixed text-secondary ring-4 ring-surface-container-lowest">
            <Icon name="construction" className="text-[16px]" />
          </span>
        </span>
        <h2 className="font-headline-sm text-headline-sm text-primary">{t('title')}</h2>
        <p className="max-w-lg font-body-md text-body-md text-on-surface-variant">{t(`sections.${section}`)}</p>
        <p className="max-w-lg font-body-md text-body-md text-on-surface-variant">{t('body')}</p>
        <Button href="/admin" variant="primary" icon="dashboard" className="mt-2">
          {t('back')}
        </Button>
      </div>
    </>
  )
}
