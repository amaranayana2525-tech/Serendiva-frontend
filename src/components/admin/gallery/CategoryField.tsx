'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { SelectField } from '@/components/admin/kit/form/SelectField'
import { TextField } from '@/components/admin/kit/form/TextField'
import { slugify } from '@/components/admin/kit/form/SlugField'
import { useGalleryCategoryLabel } from './useGalleryCategoryLabel'

const NEW = '__new__'

export interface CategoryFieldProps {
  value: string
  onChange: (slug: string) => void
  /** Existing category slugs. */
  categories: readonly string[]
  error?: string | null
  required?: boolean
  className?: string
}

/** Gallery category: pick an existing one or type a new slug ("New category…"). */
export function CategoryField({ value, onChange, categories, error, required, className }: CategoryFieldProps) {
  const t = useTranslations('adminLibrary.gallery')
  const label = useGalleryCategoryLabel()
  const known = categories.includes(value)
  const [creating, setCreating] = useState(() => value !== '' && !known)
  const showNew = creating || (value !== '' && !known)
  return (
    <div className={className}>
      <div className="flex flex-col gap-2">
        <SelectField
          label={t('fields.category')}
          required={required}
          value={showNew ? NEW : value}
          placeholder={t('fields.categoryPlaceholder')}
          error={showNew ? null : error}
          onValueChange={(v) => {
            if (v === NEW) {
              setCreating(true)
              onChange('')
            } else {
              setCreating(false)
              onChange(v)
            }
          }}
          options={[
            ...categories.map((slug) => ({ value: slug, label: label(slug) })),
            { value: NEW, label: t('fields.newCategory') },
          ]}
        />
        {showNew && (
          <TextField
            label={t('fields.newCategorySlug')}
            hint={t('fields.newCategoryHint')}
            required={required}
            autoFocus
            value={value}
            maxLength={100}
            error={error}
            placeholder={t('fields.newCategoryPlaceholder')}
            onChange={(e) =>
              onChange(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]+/g, '-')
                  .replace(/-{2,}/g, '-'),
              )
            }
            onBlur={() => onChange(slugify(value))}
          />
        )}
      </div>
    </div>
  )
}
