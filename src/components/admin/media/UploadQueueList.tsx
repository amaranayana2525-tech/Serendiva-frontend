'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Button, IconButton } from '@/components/admin/kit/Button'
import { Icon } from '@/components/ui/Icon'
import { formatBytes } from '@/lib/admin/format'
import { cn } from '@/lib/utils'
import type { UploadEntry, UploadQueue } from './useUploadQueue'

export interface UploadQueueListProps {
  queue: UploadQueue
  className?: string
}

const STATUS_ICON: Record<UploadEntry['status'], { icon: string; className: string }> = {
  queued: { icon: 'schedule', className: 'text-on-surface-variant' },
  uploading: { icon: 'progress_activity', className: 'animate-spin text-primary' },
  processing: { icon: 'progress_activity', className: 'animate-spin text-primary' },
  done: { icon: 'check_circle', className: 'text-tertiary-container' },
  error: { icon: 'error', className: 'text-error' },
}

/** Per-file rows of an upload queue: preview, name/size, progress bar, status or the API's error message. */
export function UploadQueueList({ queue, className }: UploadQueueListProps) {
  const t = useTranslations('adminLibrary.upload')
  const { entries, counts } = queue
  if (entries.length === 0) return null
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-body-md text-body-md text-on-surface-variant" aria-live="polite">
          {[
            counts.done ? t('summaryDone', { count: counts.done }) : null,
            counts.failed ? t('summaryFailed', { count: counts.failed }) : null,
            counts.pending ? t('summaryPending', { count: counts.pending }) : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {counts.pending < entries.length && (
          <Button size="sm" variant="ghost" icon="clear_all" onClick={queue.clearFinished}>
            {t('clearFinished')}
          </Button>
        )}
      </div>
      <ul
        aria-label={t('queueLabel')}
        className="flex flex-col divide-y divide-surface-container rounded-xl border border-surface-container-high bg-surface-container-lowest"
      >
        {entries.map((entry) => {
          const status = STATUS_ICON[entry.status]
          const percent = Math.round(entry.progress * 100)
          return (
            <li key={entry.key} className="flex items-center gap-3 px-3 py-2.5">
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-surface-container">
                {entry.previewUrl ? (
                  <Image src={entry.previewUrl} alt="" fill sizes="44px" unoptimized className="object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-on-surface-variant">
                    <Icon name={entry.isImage ? 'image' : 'description'} className="text-[20px]" />
                  </span>
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex min-w-0 items-baseline justify-between gap-2">
                  <span className="truncate font-body-md text-body-md text-on-surface" title={entry.name}>
                    {entry.name}
                  </span>
                  <span className="shrink-0 font-caption text-caption tabular-nums text-on-surface-variant">
                    {formatBytes(entry.size)}
                  </span>
                </div>
                {entry.status === 'error' ? (
                  <p className="flex items-start gap-1 font-caption text-caption text-error">
                    <span className="sr-only">{t('status.error')}: </span>
                    {entry.error}
                  </p>
                ) : entry.status === 'done' ? (
                  <p className="font-caption text-caption text-on-surface-variant">{t('status.done')}</p>
                ) : (
                  <div className="flex items-center gap-2">
                    <div
                      role="progressbar"
                      aria-label={t('progressLabel', { name: entry.name })}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percent}
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container"
                    >
                      <div
                        className={cn(
                          'h-full rounded-full bg-primary transition-[width] duration-200',
                          entry.status === 'processing' && 'animate-pulse',
                        )}
                        style={{ width: `${entry.status === 'queued' ? 0 : percent}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right font-caption text-caption tabular-nums text-on-surface-variant">
                      {entry.status === 'uploading' ? `${percent}%` : t(`status.${entry.status}`)}
                    </span>
                  </div>
                )}
              </div>
              <Icon name={status.icon} className={cn('shrink-0 text-[20px]', status.className)} />
              {(entry.status === 'done' || entry.status === 'error') && (
                <IconButton
                  icon="close"
                  size="sm"
                  label={t('dismiss', { name: entry.name })}
                  onClick={() => queue.dismiss(entry.key)}
                />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
