'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import type { AdminMedia, AdminMediaRef } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { Button } from '../Button'
import { FieldShell } from '../form/FieldShell'
import { MediaPicker } from './MediaPicker'
import { MediaThumb, toMediaRef } from './MediaThumb'

export interface ImageFieldProps {
  label: ReactNode
  /** Current image (records return `cover: AdminMediaRef | null`; send `coverId: value?.id ?? null`). */
  value: AdminMediaRef | null
  /** Receives the new ref (null when removed) and the full library item when one was picked. */
  onChange: (value: AdminMediaRef | null, media?: AdminMedia) => void
  /** Preview aspect ratio. */
  aspect?: 'landscape' | 'video' | 'square' | 'portrait'
  hint?: ReactNode
  error?: string | null
  required?: boolean
  /** Upload folder used from the picker. */
  folder?: string
  disabled?: boolean
  className?: string
}

const aspects = {
  landscape: 'aspect-[4/3]',
  video: 'aspect-video',
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
} as const

/** Single image picker: preview + alt text, "Choose / Replace" (MediaPicker with upload) and "Remove". */
export function ImageField({
  label,
  value,
  onChange,
  aspect = 'landscape',
  hint,
  error,
  required,
  folder,
  disabled,
  className,
}: ImageFieldProps) {
  const t = useTranslations('admin.kit.media')
  const [open, setOpen] = useState(false)
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy }) => (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div
            className={cn(
              'relative w-full max-w-[16rem] overflow-hidden rounded-lg border',
              aspects[aspect],
              value ? 'border-surface-container-high' : 'border-dashed border-outline-variant bg-surface-container-low',
              error && 'border-error',
            )}
          >
            {value ? (
              <MediaThumb media={value} sizes="256px" />
            ) : (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-on-surface-variant">
                <Icon name="add_photo_alternate" className="text-[28px]" />
                <span className="font-caption text-caption">{t('noImage')}</span>
              </span>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            {value && (
              <p className="font-caption text-caption text-on-surface-variant">
                <span className="font-semibold text-on-surface">{t('altLabel')}</span>{' '}
                {value.alt || <span className="italic text-secondary">{t('altMissing')}</span>}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                id={id}
                size="sm"
                icon={value ? 'swap_horiz' : 'add_photo_alternate'}
                onClick={() => setOpen(true)}
                disabled={disabled}
                aria-describedby={describedBy}
              >
                {value ? t('replace') : t('choose')}
              </Button>
              {value && (
                <Button size="sm" variant="dangerGhost" icon="delete" onClick={() => onChange(null)} disabled={disabled}>
                  {t('remove')}
                </Button>
              )}
            </div>
          </div>
          <MediaPicker
            open={open}
            onClose={() => setOpen(false)}
            folder={folder}
            onSelect={([media]) => media && onChange(toMediaRef(media), media)}
          />
        </div>
      )}
    </FieldShell>
  )
}
