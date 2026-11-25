'use client'

import { useTranslations } from 'next-intl'
import { ImageField } from '@/components/admin/kit/media/ImageField'
import { Icon } from '@/components/ui/Icon'
import { useEditor } from './EditorContext'

/** Repeater header extra: red error marker (when the item has errors) or the item's icon. */
export function ItemMarker({ prefix, icon }: { prefix: string; icon?: string }) {
  const t = useTranslations('adminContent.editor')
  const { hasErrorUnder } = useEditor()
  if (hasErrorUnder(prefix)) {
    return (
      <span className="flex h-7 items-center gap-1 rounded-md bg-error-container px-1.5 text-on-error-container">
        <Icon name="error" className="text-[16px]" />
        <span className="sr-only">{t('itemHasErrors')}</span>
      </span>
    )
  }
  if (!icon) return null
  return (
    <span aria-hidden="true" className="hidden h-7 w-7 items-center justify-center rounded-md bg-surface-container text-secondary sm:flex">
      <Icon name={icon} className="text-[18px]" />
    </span>
  )
}

/** ImageField bound to a media id (experiences / stays store `imageId`; previews come from the editor's ref map). */
export function MediaIdField({
  label,
  imageId,
  onChange,
  error,
  hint,
}: {
  label: string
  imageId: string | null
  onChange: (id: string | null) => void
  error?: string
  hint?: string
}) {
  const { refs, addRef } = useEditor()
  const value = imageId ? (refs[imageId] ?? null) : null
  return (
    <ImageField
      label={label}
      value={value}
      hint={hint}
      error={error}
      folder="destinations"
      onChange={(ref) => {
        if (ref) addRef(ref)
        onChange(ref?.id ?? null)
      }}
    />
  )
}
