'use client'

import { useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { TextField } from '@/components/admin/kit/form/TextField'
import { ImageField } from '@/components/admin/kit/media/ImageField'
import { Icon } from '@/components/ui/Icon'
import type { AdminMediaRef, AdminSettings } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { SettingsCard, useSettingForm, type SectionProps } from './SettingsForm'
import { humanizeSlot, refOf, settingsApi, slotGroup } from './settingsApi'

interface SlotItem {
  slot: string
  /** Stored media id (kept even when no preview ref is available). */
  imageId: string | null
  image: AdminMediaRef | null
}
interface PageImagesForm {
  items: SlotItem[]
}

const pageImagesFrom = (s: AdminSettings): PageImagesForm => ({
  items: (s.pageImages ?? []).map((p) => ({ slot: p.slot, imageId: p.imageId, image: refOf(s, p.imageId) })),
})

/** Display order of the slot groups (others follow alphabetically). */
const GROUP_ORDER = [
  'home',
  'guide',
  'about',
  'tours',
  'dest',
  'plan',
  'map',
  'fleet',
  'corp',
  'quiz',
  'responsible',
  'travel',
  'blog',
  'gallery',
  'review',
]

/**
 * Static page images (~136 slots, e.g. "about-field-zoology-yala"): grouped by page prefix, searchable, one image
 * picker per slot. Saved together with PUT /settings/pageImages (empty slots are dropped → the page shows a placeholder).
 */
export function PageImagesSection({ settings, onSaved, onDirtyChange }: SectionProps) {
  const tp = useTranslations('adminLibrary.settings.pageImages')
  const tg = useTranslations('adminLibrary.settings.pageImages.groups')
  const searchId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set())
  const f = useSettingForm<PageImagesForm>({
    id: 'settings-pageImages',
    settings,
    fromSettings: pageImagesFrom,
    successMessage: tp('saved'),
    onSaved,
    onDirtyChange,
    save: (form) =>
      settingsApi.pageImages(form.items.flatMap((i) => (i.imageId ? [{ slot: i.slot, imageId: i.imageId }] : []))),
  })
  const { form, errors } = f

  const groupLabel = (group: string) =>
    tg.has(group as Parameters<typeof tg>[0]) ? tg(group as Parameters<typeof tg>[0]) : humanizeSlot(`x-${group}`)
  const q = query.trim().toLowerCase()
  const matches = (item: SlotItem) =>
    !q ||
    item.slot.includes(q) ||
    humanizeSlot(item.slot).toLowerCase().includes(q) ||
    groupLabel(slotGroup(item.slot)).toLowerCase().includes(q)

  const groups = new Map<string, { item: SlotItem; index: number }[]>()
  form.items.forEach((item, index) => {
    if (!matches(item)) return
    const g = slotGroup(item.slot)
    groups.set(g, [...(groups.get(g) ?? []), { item, index }])
  })
  const ordered = [...groups.keys()].sort((a, b) => {
    const ia = GROUP_ORDER.indexOf(a)
    const ib = GROUP_ORDER.indexOf(b)
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    return a.localeCompare(b)
  })
  // Last saved state (the screen replaces `settings` with the PUT response after every save).
  const baseline = new Map((settings.pageImages ?? []).map((p) => [p.slot, p.imageId]))
  const changed = (item: SlotItem) => (baseline.get(item.slot) ?? null) !== item.imageId
  const changedCount = form.items.filter(changed).length
  const emptyCount = form.items.filter((i) => !i.imageId).length
  const total = [...groups.values()].reduce((n, list) => n + list.length, 0)

  const setSlot = (index: number, image: AdminMediaRef | null) =>
    f.setForm((prev) => ({
      items: prev.items.map((it, i) => (i === index ? { ...it, image, imageId: image?.id ?? null } : it)),
    }))
  const toggle = (group: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  const firstError = Object.values(errors)[0]

  return (
    <SettingsCard
      id="settings-pageImages"
      title={tp('title')}
      description={tp('description', { count: form.items.length })}
      icon="image"
      dirty={f.dirty}
      saving={f.saving}
      onSubmit={f.submit}
      onDiscard={f.discard}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <TextField
          id={searchId}
          label={tp('search')}
          type="search"
          icon="search"
          value={query}
          placeholder={tp('searchPlaceholder')}
          onChange={(e) => setQuery(e.target.value)}
          fieldClassName="sm:w-80"
        />
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-caption text-caption text-on-surface-variant" aria-live="polite">
            {q ? tp('matches', { count: total }) : tp('summary', { count: form.items.length, changed: changedCount })}
          </p>
          {!q && (
            <>
              <Button size="sm" variant="ghost" onClick={() => setOpen(new Set(ordered))}>
                {tp('expandAll')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setOpen(new Set())}>
                {tp('collapseAll')}
              </Button>
            </>
          )}
        </div>
      </div>
      {emptyCount > 0 && (
        <p className="flex items-start gap-1.5 rounded-lg bg-secondary-fixed/40 px-3 py-2 font-caption text-caption text-on-secondary-fixed-variant">
          <Icon name="warning" className="mt-px text-[16px]" />
          {tp('emptyWarning', { count: emptyCount })}
        </p>
      )}
      {firstError && (
        <p role="alert" className="flex items-start gap-1.5 font-caption text-caption text-error">
          <Icon name="error" className="mt-px text-[16px]" />
          {firstError}
        </p>
      )}

      {ordered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-outline-variant px-4 py-8 text-center font-body-md text-body-md text-on-surface-variant">
          {form.items.length ? tp('noMatches') : tp('none')}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ordered.map((group) => {
            const list = groups.get(group) ?? []
            const expanded = Boolean(q) || open.has(group)
            const groupChanged = list.filter(({ item }) => changed(item)).length
            const panelId = `${searchId}-${group}`
            return (
              <li key={group} className="rounded-xl border border-surface-container-high">
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => toggle(group)}
                  disabled={Boolean(q)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-default disabled:hover:bg-transparent"
                >
                  <span className="flex min-w-0 flex-1 items-baseline gap-2">
                    <span className="truncate font-body-md text-body-md font-semibold text-primary">
                      {groupLabel(group)}
                    </span>
                    <span className="font-caption text-caption text-on-surface-variant">
                      {tp('slotCount', { count: list.length })}
                    </span>
                    {groupChanged > 0 && (
                      <span className="rounded-full bg-secondary-fixed px-2 py-px font-body-md text-[11px] font-semibold text-on-secondary-fixed-variant">
                        {tp('changedCount', { count: groupChanged })}
                      </span>
                    )}
                  </span>
                  <span className="hidden shrink-0 -space-x-2 sm:flex" aria-hidden="true">
                    {list.slice(0, 4).map(({ item }) =>
                      item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element -- tiny API thumbnails in the group header
                        <img
                          key={item.slot}
                          src={item.image.thumbUrl ?? item.image.url}
                          alt=""
                          loading="lazy"
                          className="h-7 w-7 rounded-full border-2 border-surface-container-lowest object-cover"
                        />
                      ) : null,
                    )}
                  </span>
                  {!q && (
                    <Icon
                      name="expand_more"
                      className={cn(
                        'shrink-0 text-[22px] text-on-surface-variant transition-transform',
                        expanded && 'rotate-180',
                      )}
                    />
                  )}
                </button>
                <div id={panelId} hidden={!expanded} className="border-t border-surface-container px-3 pb-4 pt-3">
                  {expanded && (
                    <div className="grid gap-x-6 gap-y-5 xl:grid-cols-2">
                      {list.map(({ item, index }) => (
                        <ImageField
                          key={item.slot}
                          label={
                            <span className="inline-flex flex-wrap items-center gap-1.5">
                              {humanizeSlot(item.slot)}
                              {changed(item) && (
                                <span className="rounded-full bg-secondary-fixed px-1.5 py-px font-body-md text-[10px] font-semibold uppercase tracking-wide text-on-secondary-fixed-variant">
                                  {tp('changed')}
                                </span>
                              )}
                            </span>
                          }
                          hint={<span className="font-mono text-[11px]">{item.slot}</span>}
                          value={item.image}
                          error={
                            errors[`${index}.imageId`] ??
                            (item.imageId && !item.image ? tp('previewMissing') : undefined)
                          }
                          folder="settings"
                          onChange={(image) => setSlot(index, image)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </SettingsCard>
  )
}
