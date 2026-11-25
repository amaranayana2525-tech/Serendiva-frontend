'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import { CopyButton } from '@/components/admin/kit/actions'
import { Button } from '@/components/admin/kit/Button'
import { useConfirm } from '@/components/admin/kit/ConfirmDialog'
import { DetailList, DetailSection } from '@/components/admin/kit/DetailList'
import { Drawer } from '@/components/admin/kit/Drawer'
import { TextField } from '@/components/admin/kit/form/TextField'
import { LocaleTabs } from '@/components/admin/kit/LocaleTabs'
import { ErrorPanel, LoadingPanel } from '@/components/admin/kit/Panels'
import { Icon } from '@/components/ui/Icon'
import { formatBytes } from '@/lib/admin/format'
import { invalidateAdminQueries, useAdminMutation, useAdminQuery, type AdminQueryResult } from '@/lib/admin/hooks'
import { ADMIN_LOCALES, localeErrors, toEditable, type AdminLocale } from '@/lib/admin/translatable'
import { confirmDiscardChanges, useUnsavedChanges } from '@/lib/admin/unsaved'
import type { AdminMediaDetail, MediaUsage } from '@/lib/api/types'
import { isImageMime, mediaApi, mediaFolder, mediaName } from './mediaApi'
import { MediaUsageList, usageFromError } from './MediaUsageList'

export interface MediaDetailDrawerProps {
  /** Media id from the URL (`?id=`); null = closed. */
  id: string | null
  onClose: () => void
  /** Called after the file was deleted (the drawer closes itself). */
  onDeleted?: (id: string) => void
}

/** Detail drawer: large preview, URL + copy, file facts, alt text per locale, usage list, delete (409 → usage). */
export function MediaDetailDrawer({ id, onClose, onDeleted }: MediaDetailDrawerProps) {
  const t = useTranslations('adminLibrary.media')
  const detail = useAdminQuery(['media', 'detail', id ?? ''], (signal) => mediaApi.get(id ?? '', signal), [], {
    enabled: id !== null,
    keepPreviousData: false,
  })
  const media = id && detail.data?.id === id ? detail.data : undefined
  const close = async () => {
    if (await confirmDiscardChanges()) onClose()
  }
  return (
    <Drawer
      open={id !== null}
      onClose={() => void close()}
      title={<span className="break-all">{media ? mediaName(media) : t('detailTitle')}</span>}
      subtitle={media ? media.mime : undefined}
      size="lg"
    >
      {id && <DrawerBody key={id} id={id} detail={detail} onClose={onClose} onDeleted={onDeleted} />}
    </Drawer>
  )
}

function DrawerBody({
  id,
  detail,
  onClose,
  onDeleted,
}: {
  id: string
  detail: AdminQueryResult<AdminMediaDetail>
  onClose: () => void
  onDeleted?: (id: string) => void
}) {
  const t = useTranslations('adminLibrary.media')
  const media = detail.data?.id === id ? detail.data : undefined
  if (detail.error && !media) {
    return detail.error.isNotFound ? (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <Icon name="search_off" className="text-[32px] text-outline" />
        <p className="font-body-lg text-body-lg font-semibold text-primary">{t('notFoundTitle')}</p>
        <p className="max-w-sm font-body-md text-body-md text-on-surface-variant">{t('notFoundBody')}</p>
        <Button className="mt-2" onClick={onClose}>
          {t('close')}
        </Button>
      </div>
    ) : (
      <ErrorPanel error={detail.error} onRetry={() => void detail.refetch()} variant="inline" />
    )
  }
  if (!media) return <LoadingPanel variant="detail" rows={6} card={false} />
  return <MediaDetail media={media} detail={detail} onClose={onClose} onDeleted={onDeleted} />
}

function MediaDetail({
  media,
  detail,
  onClose,
  onDeleted,
}: {
  media: AdminMediaDetail
  detail: AdminQueryResult<AdminMediaDetail>
  onClose: () => void
  onDeleted?: (id: string) => void
}) {
  const t = useTranslations('adminLibrary.media')
  const tf = useTranslations('adminLibrary.folders')
  const format = useFormatter()
  const confirm = useConfirm()
  const image = isImageMime(media.mime)
  const name = mediaName(media)
  const [locale, setLocale] = useState<AdminLocale>('en')
  const [alt, setAlt] = useState(() => toEditable(media.altText))
  const [savedAlt, setSavedAlt] = useState(() => toEditable(media.altText))
  const [conflict, setConflict] = useState<MediaUsage[] | null>(null)
  const dirty = ADMIN_LOCALES.some((l) => alt[l].trim() !== savedAlt[l].trim())
  useUnsavedChanges(dirty)

  const saveAlt = useAdminMutation(
    () => mediaApi.updateAlt(media.id, { en: alt.en.trim(), zh: alt.zh.trim(), de: alt.de.trim() }),
    {
      successToast: t('altSaved'),
      onSuccess: (updated) => {
        const next = toEditable(updated.altText)
        setAlt(next)
        setSavedAlt(next)
        detail.setData((prev) => (prev ? { ...prev, ...updated, usage: prev.usage } : prev))
        invalidateAdminQueries('media')
      },
    },
  )
  const altErrors = localeErrors(saveAlt.error?.fieldErrors ?? {}, 'altText')

  const remove = useAdminMutation(() => mediaApi.remove(media.id), {
    successToast: t('deleted'),
    errorToast: (err) => (err.code === 'MEDIA_IN_USE' ? t('inUseTitle') : err.message),
    onError: (err) => {
      if (err.code === 'MEDIA_IN_USE') {
        setConflict(usageFromError(err))
        void detail.refetch()
      }
    },
    onSuccess: () => {
      invalidateAdminQueries('media')
      onDeleted?.(media.id)
      onClose()
    },
  })

  const onDelete = async () => {
    setConflict(null)
    const ok = await confirm({
      title: t('deleteTitle'),
      body: media.usage.length ? t('deleteBodyUsed', { name, count: media.usage.length }) : t('deleteBody', { name }),
      confirmLabel: t('delete'),
      tone: 'danger',
      icon: 'delete',
    })
    if (ok) await remove.mutate()
  }

  const previewUrl = media.variants.large?.url ?? media.variants.medium?.url ?? media.url
  const folder = mediaFolder(media.url)
  const filled = Object.fromEntries(ADMIN_LOCALES.map((l) => [l, Boolean(alt[l].trim())])) as Record<
    AdminLocale,
    boolean
  >
  const errorLocales = Object.fromEntries(ADMIN_LOCALES.map((l) => [l, Boolean(altErrors[l])])) as Record<
    AdminLocale,
    boolean
  >

  return (
    <div className="flex flex-col gap-5">
      {/* preview */}
      <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl bg-surface-container">
        {image ? (
          <Image
            src={previewUrl}
            alt={alt.en || ''}
            fill
            sizes="(min-width:640px) 36rem, 100vw"
            unoptimized
            className="object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-on-surface-variant">
            <Icon name="description" className="text-[56px]" />
            <Button href={media.url} external icon="open_in_new" size="sm">
              {t('openFile')}
            </Button>
          </div>
        )}
      </div>

      {/* url */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="media-url" className="font-body-md text-[13px] font-semibold text-on-surface">
          {t('url')}
        </label>
        <div className="flex items-center gap-1.5">
          <input
            id="media-url"
            readOnly
            value={media.url}
            onFocus={(e) => e.currentTarget.select()}
            className="block min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 font-mono text-[12px] text-on-surface-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
          <CopyButton value={media.url} label={t('copyUrl')} size="md" />
          <a
            href={media.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('openOriginal')}
            title={t('openOriginal')}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Icon name="open_in_new" className="text-[20px]" />
          </a>
        </div>
      </div>

      <DetailSection title={t('sections.file')} icon="info">
        <DetailList
          items={[
            { label: t('fields.type'), value: media.mime },
            { label: t('fields.size'), value: formatBytes(media.size) },
            {
              label: t('fields.dimensions'),
              value:
                media.width && media.height ? t('dimensionsValue', { width: media.width, height: media.height }) : null,
            },
            {
              label: t('fields.uploaded'),
              value: format.dateTime(new Date(media.createdAt), {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
            {
              label: t('fields.folder'),
              value: folder
                ? tf.has(folder as Parameters<typeof tf>[0])
                  ? tf(folder as Parameters<typeof tf>[0])
                  : folder
                : null,
            },
            { label: t('fields.originalName'), value: media.originalName },
          ]}
        />
      </DetailSection>

      {image && (
        <DetailSection title={t('sections.alt')} icon="translate">
          <form
            noValidate
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (dirty) void saveAlt.mutate()
            }}
          >
            <p className="font-body-md text-body-md text-on-surface-variant">{t('altHelp')}</p>
            <LocaleTabs
              value={locale}
              onChange={setLocale}
              filled={filled}
              errors={errorLocales}
              className="self-start"
            />
            <TextField
              key={locale}
              label={t('altLabel', { locale: locale.toUpperCase() })}
              value={alt[locale]}
              maxLength={300}
              counter
              lang={locale}
              placeholder={locale !== 'en' && alt.en ? alt.en : t('altPlaceholder')}
              error={altErrors[locale]}
              onChange={(e) => setAlt((prev) => ({ ...prev, [locale]: e.target.value }))}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="submit"
                variant="primary"
                icon="check"
                size="sm"
                loading={saveAlt.pending}
                disabled={!dirty}
              >
                {t('saveAlt')}
              </Button>
              {dirty && (
                <Button size="sm" variant="ghost" onClick={() => setAlt(savedAlt)}>
                  {t('resetAlt')}
                </Button>
              )}
              {dirty && <span className="font-caption text-caption text-secondary">{t('unsaved')}</span>}
            </div>
          </form>
        </DetailSection>
      )}

      <DetailSection title={t('sections.usage', { count: media.usage.length })} icon="link">
        {media.usage.length ? (
          <MediaUsageList usage={media.usage} />
        ) : (
          <p className="flex items-center gap-1.5 font-body-md text-body-md text-on-surface-variant">
            <Icon name="check_circle" className="text-[18px] text-tertiary-container" />
            {t('notUsed')}
          </p>
        )}
      </DetailSection>

      {conflict && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-xl border border-secondary/40 bg-secondary-fixed/40 p-4"
        >
          <p className="flex items-center gap-1.5 font-body-md text-body-md font-semibold text-on-secondary-fixed-variant">
            <Icon name="block" className="text-[18px]" />
            {t('inUseTitle')}
          </p>
          <p className="font-body-md text-body-md text-on-surface">{t('inUseBody', { count: conflict.length })}</p>
          {conflict.length > 0 && <MediaUsageList usage={conflict} />}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-surface-container-high pt-4">
        <Button variant="dangerGhost" icon="delete" loading={remove.pending} onClick={() => void onDelete()}>
          {t('delete')}
        </Button>
        <span className="font-caption text-caption text-on-surface-variant">
          {media.usage.length ? t('deleteHintUsed') : t('deleteHint')}
        </span>
      </div>
    </div>
  )
}
