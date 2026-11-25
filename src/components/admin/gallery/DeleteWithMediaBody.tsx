'use client'

import { useId, useState } from 'react'
import { useTranslations } from 'next-intl'

/** Confirm-dialog body for deleting a gallery item, with an opt-in "also delete the file from the media library". */
export function DeleteWithMediaBody({
  text,
  canDeleteMedia,
  onChange,
}: {
  text: string
  canDeleteMedia: boolean
  onChange: (deleteMedia: boolean) => void
}) {
  const t = useTranslations('adminLibrary.gallery')
  const id = useId()
  const [checked, setChecked] = useState(false)
  return (
    <div className="flex flex-col gap-3">
      <p>{text}</p>
      {canDeleteMedia && (
        <label
          htmlFor={id}
          className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-surface-container-low px-3 py-2.5"
        >
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => {
              setChecked(e.target.checked)
              onChange(e.target.checked)
            }}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-secondary"
          />
          <span className="flex flex-col">
            <span className="font-medium text-on-surface">{t('deleteMediaToo')}</span>
            <span className="font-caption text-caption">{t('deleteMediaHint')}</span>
          </span>
        </label>
      )}
    </div>
  )
}
