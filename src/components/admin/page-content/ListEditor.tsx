'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { IconPicker } from '@/components/admin/kit/IconPicker'
import { Repeater } from '@/components/admin/kit/Repeater'
import { TextArea } from '@/components/admin/kit/form/TextArea'
import { TextField } from '@/components/admin/kit/form/TextField'
import { ImageField } from '@/components/admin/kit/media/ImageField'
import type { AdminMediaRef } from '@/lib/api/types'
import type { PageContentListModel } from '@/lib/page-content/registry'
import { itemSlot } from '@/lib/page-content/slots'
import { defaultItems, listErrorKey, newItemKey, type EditItem } from './listState'
import type { SlotImages } from './pageImages'
import { humanizeId } from './pageContentApi'

const fieldName = (field: string) => field.split('.').map(humanizeId).join(' › ')
const isLong = (text: string) => text.length > 90 || text.includes('\n')

export interface ListEditorProps {
  model: PageContentListModel
  items: EditItem[]
  onChange: (items: EditItem[]) => void
  errors: Record<string, string>
  /** Prefix for DOM ids (focus on the first error). */
  idPrefix: string
  /** Page photos by slot (lists with `image`: one photo per item). */
  images?: SlotImages
  onImage?: (slot: string, image: AdminMediaRef | null) => void
}

export const listFieldId = (idPrefix: string, path: string, key: string, field: string) =>
  `${idPrefix}-${`${path}-${key}-${field}`.replace(/[^A-Za-z0-9_-]/g, '-')}`

/** Re-order, remove, restore and (when allowed) add the items of one page list. */
export function ListEditor({ model, items, onChange, errors, idPrefix, images, onImage }: ListEditorProps) {
  const t = useTranslations('adminContent.pageContent.list')
  const removed = model.defaults.filter((d) => !items.some((i) => i.key === d.key))
  const firstField = model.fields[0]
  const template = model.defaults[0]?.texts ?? {}
  const isDefault = JSON.stringify(items) === JSON.stringify(defaultItems(model))

  const labelOf = (item: EditItem, index: number) =>
    (firstField && item.values[firstField]?.trim()) || t('itemN', { n: index + 1 })

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-surface-container p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto font-caption text-caption text-on-surface-variant">
          {model.addable ? t('hintAddable') : t('hintFixed')}
        </p>
        {!isDefault && (
          <Button size="sm" variant="ghost" icon="restart_alt" onClick={() => onChange(defaultItems(model))}>
            {t('resetList')}
          </Button>
        )}
      </div>
      <Repeater<EditItem>
        label={t('label')}
        items={items}
        onChange={onChange}
        getKey={(item) => item.key}
        itemLabel={labelOf}
        createItem={() => ({
          key: newItemKey(),
          values: Object.fromEntries(model.fields.map((f) => [f, ''])),
          icon: null,
          isNew: true,
        })}
        duplicateItem={model.addable ? (item) => ({ ...structuredClone(item), key: newItemKey(), isNew: true }) : null}
        addLabel={t('add')}
        max={model.addable ? model.max : items.length}
        defaultCollapsed
        emptyText={t('empty')}
        headerExtra={(item) =>
          item.isNew ? (
            <span className="rounded-full bg-tertiary-fixed px-2 py-0.5 font-caption text-caption text-on-tertiary-fixed">
              {t('new')}
            </span>
          ) : null
        }
        renderItem={(item, helpers) => {
          const builtIn = model.defaults.find((d) => d.key === item.key)
          const slot = model.image ? itemSlot(model.image, item.key) : null
          return (
            <div className="flex flex-col gap-3">
              {slot && onImage && (
                <ImageField
                  label={t('photo')}
                  value={images?.[slot] ?? null}
                  onChange={(ref) => onImage(slot, ref)}
                  aspect={model.image?.aspect ?? 'landscape'}
                  folder="settings"
                  hint={item.isNew ? t('photoNewHint') : undefined}
                  className="sm:max-w-sm"
                />
              )}
              {Object.entries(item.values).map(([field, value]) => {
                const original = builtIn?.texts[field] ?? template[field] ?? ''
                const props = {
                  id: listFieldId(idPrefix, model.path, item.key, field),
                  label: fieldName(field),
                  value,
                  placeholder: builtIn ? original : '',
                  required: !builtIn,
                  error: errors[listErrorKey(model.path, item.key, field)] ?? null,
                  hint: builtIn && value.trim() === '' ? t('emptyHint') : undefined,
                }
                const onValue = (text: string) =>
                  helpers.update((it) => ({ ...it, values: { ...it.values, [field]: text } }))
                return isLong(original) ? (
                  <TextArea key={field} {...props} rows={3} onChange={(e) => onValue(e.target.value)} />
                ) : (
                  <TextField key={field} {...props} onChange={(e) => onValue(e.target.value)} />
                )
              })}
              {model.icon && (
                <IconPicker
                  label={t('icon')}
                  value={item.icon}
                  onChange={(icon) => helpers.update({ icon })}
                  hint={t('iconHint')}
                />
              )}
            </div>
          )
        }}
      />
      {removed.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-caption text-caption text-on-surface-variant">{t('restoreLabel')}</span>
          {removed.map((d) => (
            <Button
              key={d.key}
              size="sm"
              variant="secondary"
              icon="undo"
              onClick={() => {
                const index = model.defaults.findIndex((x) => x.key === d.key)
                const next = [...items]
                // put it back near its original position
                next.splice(Math.min(index, next.length), 0, { key: d.key, values: { ...d.texts }, icon: null, isNew: false })
                onChange(next)
              }}
            >
              {(firstField && d.texts[firstField]) || d.key}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
