'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { Card } from '@/components/admin/kit/Card'
import { PageHeader } from '@/components/admin/kit/PageHeader'
import { ErrorPanel, LoadingPanel } from '@/components/admin/kit/Panels'
import { Icon } from '@/components/ui/Icon'
import { useAdminQuery } from '@/lib/admin/hooks'
import { useUrlParam } from '@/lib/admin/url-state'
import type { AdminSettings } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { ChangePasswordDialog } from '../shell/ChangePasswordDialog'
import { ContactSection, SocialSection } from './ContactSections'
import {
  CorporateClientsSection,
  CountersSection,
  HeroSlidesSection,
  InstagramFeedSection,
  TrustBadgesSection,
} from './ListSections'
import { PageImagesSection } from './PageImagesSection'
import { GuideSection, SeoSection } from './ProfileSections'
import type { SectionProps } from './SettingsForm'
import { settingsApi } from './settingsApi'

type SectionKey =
  | 'contact'
  | 'social'
  | 'guide'
  | 'counters'
  | 'trustBadges'
  | 'heroSlides'
  | 'seo'
  | 'corporateClients'
  | 'instagramFeed'
  | 'pageImages'
  | 'password'

const SECTIONS: readonly { key: SectionKey; icon: string; component?: ComponentType<SectionProps> }[] = [
  { key: 'contact', icon: 'contact_phone', component: ContactSection },
  { key: 'social', icon: 'share', component: SocialSection },
  { key: 'guide', icon: 'badge', component: GuideSection },
  { key: 'counters', icon: 'leaderboard', component: CountersSection },
  { key: 'trustBadges', icon: 'verified', component: TrustBadgesSection },
  { key: 'heroSlides', icon: 'slideshow', component: HeroSlidesSection },
  { key: 'seo', icon: 'travel_explore', component: SeoSection },
  { key: 'corporateClients', icon: 'business_center', component: CorporateClientsSection },
  { key: 'instagramFeed', icon: 'photo_camera', component: InstagramFeedSection },
  { key: 'pageImages', icon: 'image', component: PageImagesSection },
  { key: 'password', icon: 'lock_reset' },
]

const isSection = (v: string | null): v is SectionKey => SECTIONS.some((s) => s.key === v)

/**
 * /admin/settings — one form per setting key (own Save, dirty tracking, unsaved warning, validation mapping), chosen
 * from a side menu (`?section=`). Every form stays mounted while switching, so unsaved edits survive.
 */
export function SettingsScreen() {
  const t = useTranslations('adminLibrary.settings')
  const param = useUrlParam('section')
  const active: SectionKey = isSection(param.value) ? param.value : 'contact'
  const settings = useAdminQuery(['settings'], (signal) => settingsApi.get(signal))
  const [dirty, setDirty] = useState<Partial<Record<SectionKey, boolean>>>({})
  const setData = settings.setData

  const dirtyHandlers = useMemo(
    () =>
      Object.fromEntries(
        SECTIONS.map((s) => [
          s.key,
          (value: boolean) => setDirty((prev) => (Boolean(prev[s.key]) === value ? prev : { ...prev, [s.key]: value })),
        ]),
      ) as Record<SectionKey, (dirty: boolean) => void>,
    [],
  )
  const onSaved = useCallback((next: AdminSettings) => setData(next), [setData])

  // Phones: keep the active section visible in the horizontal menu.
  const navList = useRef<HTMLUListElement>(null)
  useEffect(() => {
    const list = navList.current
    const item = list?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!list || !item || list.scrollWidth <= list.clientWidth) return
    list.scrollTo({ left: Math.max(0, item.offsetLeft - 16), behavior: 'smooth' })
  }, [active])

  const select = (key: SectionKey) => {
    param.set(key === 'contact' ? null : key)
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() =>
        document.getElementById('settings-panel')?.scrollIntoView({ block: 'start', behavior: 'smooth' }),
      )
    }
  }

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[15rem_minmax(0,1fr)] xl:gap-6">
        <nav aria-label={t('sectionsLabel')} className="min-w-0 lg:sticky lg:top-20">
          <ul
            ref={navList}
            className="no-scrollbar relative -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
          >
            {SECTIONS.map((s) => {
              const current = s.key === active
              return (
                <li key={s.key} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => select(s.key)}
                    aria-current={current ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-left font-body-md text-body-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      current
                        ? 'bg-surface-container-lowest font-semibold text-primary shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-primary',
                    )}
                  >
                    <Icon name={s.icon} className={cn('text-[18px]', current ? 'text-secondary' : '')} />
                    <span className="flex-1">{t(`nav.${s.key}`)}</span>
                    {dirty[s.key] && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-secondary" title={t('unsaved')}>
                        <span className="sr-only">{t('unsaved')}</span>
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div id="settings-panel" className="min-w-0 scroll-mt-20">
          {settings.error && !settings.data ? (
            <ErrorPanel error={settings.error} onRetry={() => void settings.refetch()} />
          ) : !settings.data ? (
            <LoadingPanel variant="form" rows={8} />
          ) : (
            SECTIONS.map(({ key, component: Section }) => (
              <div key={key} hidden={key !== active}>
                {Section ? (
                  <Section
                    settings={settings.data as AdminSettings}
                    onSaved={onSaved}
                    onDirtyChange={dirtyHandlers[key]}
                  />
                ) : (
                  <PasswordSection />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

/** "Change password" card — reuses the shell's dialog (POST /auth/change-password). */
function PasswordSection() {
  const t = useTranslations('adminLibrary.settings.password')
  const [open, setOpen] = useState(false)
  return (
    <Card title={t('title')} description={t('description')} icon="lock_reset">
      <div className="flex flex-col gap-3">
        <ul className="flex flex-col gap-1.5 font-body-md text-body-md text-on-surface-variant">
          <li className="flex items-start gap-2">
            <Icon name="check" className="mt-0.5 text-[18px] text-tertiary-container" />
            {t('rule')}
          </li>
          <li className="flex items-start gap-2">
            <Icon name="devices" className="mt-0.5 text-[18px] text-secondary" />
            {t('otherDevices')}
          </li>
        </ul>
        <Button variant="primary" icon="lock_reset" className="self-start" onClick={() => setOpen(true)}>
          {t('open')}
        </Button>
      </div>
      <ChangePasswordDialog open={open} onClose={() => setOpen(false)} />
    </Card>
  )
}
