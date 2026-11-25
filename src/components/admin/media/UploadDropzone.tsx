'use client'

import { useRef, useState, type DragEvent, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'
import { ACCEPT_ATTR, type UploadAccept } from './useUploadQueue'

export interface UploadDropzoneProps {
  onFiles: (files: File[]) => void
  accept?: UploadAccept
  disabled?: boolean
  /** Replaces the default "JPEG, PNG… up to 10 MB" line. */
  hint?: ReactNode
  /** Smaller padding (inside dialogs). */
  compact?: boolean
  id?: string
  className?: string
}

/** True when a drag carries files from the OS (not an element being reordered on the page). */
const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files')

/**
 * Drag & drop zone + "Choose files" button (keyboard path) for multi-file uploads. Only reacts to file drags, so
 * sortable grids on the same page keep working.
 */
export function UploadDropzone({
  onFiles,
  accept = 'image',
  disabled,
  hint,
  compact,
  id,
  className,
}: UploadDropzoneProps) {
  const t = useTranslations('adminLibrary.upload')
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const depth = useRef(0)

  const reset = () => {
    depth.current = 0
    setOver(false)
  }

  return (
    <div
      id={id}
      onDragEnter={(e) => {
        if (disabled || !hasFiles(e)) return
        e.preventDefault()
        depth.current++
        setOver(true)
      }}
      onDragOver={(e) => {
        if (disabled || !hasFiles(e)) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
      }}
      onDragLeave={(e) => {
        if (disabled || !hasFiles(e)) return
        depth.current = Math.max(0, depth.current - 1)
        if (depth.current === 0) setOver(false)
      }}
      onDrop={(e) => {
        if (disabled || !hasFiles(e)) return
        e.preventDefault()
        reset()
        const files = Array.from(e.dataTransfer.files ?? [])
        if (files.length) onFiles(files)
      }}
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-center transition-colors',
        compact ? 'px-4 py-5' : 'px-6 py-8',
        over ? 'border-primary bg-primary-fixed/25' : 'border-outline-variant bg-surface-container-low/60',
        disabled && 'opacity-60',
        className,
      )}
    >
      <span
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full transition-colors',
          over ? 'bg-primary text-on-primary' : 'bg-surface-container text-secondary',
        )}
      >
        <Icon name="cloud_upload" className="text-[24px]" />
      </span>
      <p className="font-body-md text-body-md font-semibold text-primary">{over ? t('dropNow') : t('dropTitle')}</p>
      <div className="flex flex-wrap items-center justify-center gap-2 font-body-md text-body-md text-on-surface-variant">
        <span>{t('dropOr')}</span>
        <Button size="sm" variant="primary" icon="upload" disabled={disabled} onClick={() => input.current?.click()}>
          {t('choose')}
        </Button>
      </div>
      <p className="font-caption text-caption text-on-surface-variant">
        {hint ?? t(accept === 'image' ? 'hintImages' : 'hintAny')}
      </p>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT_ATTR[accept]}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (files.length) onFiles(files)
        }}
      />
    </div>
  )
}
