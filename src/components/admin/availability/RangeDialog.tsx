'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { useConfirm } from '@/components/admin/kit/ConfirmDialog'
import { Modal } from '@/components/admin/kit/Modal'
import { DateField } from '@/components/admin/kit/form/DateField'
import { TextArea } from '@/components/admin/kit/form/TextArea'
import { Icon } from '@/components/ui/Icon'
import { toAdminApiError } from '@/lib/admin/errors'
import { invalidateAdminQueries, useAdminErrorMessage } from '@/lib/admin/hooks'
import { toast } from '@/lib/admin/toast'
import { confirmDiscardChanges, skipUnsavedCheck, useUnsavedChanges } from '@/lib/admin/unsaved'
import type { AdminAvailabilityRange } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { availabilityApi, overlaps, rangeDays, type RangeType } from './api'
import { useRangeFormat } from './useRangeFormat'

/** What the dialog edits: an existing range, or a new one (optionally starting on a clicked day). */
export type RangeDialogState = { mode: 'edit'; range: AdminAvailabilityRange } | { mode: 'new'; startDate: string }

interface RangeForm {
  startDate: string
  endDate: string
  type: RangeType
  note: string
}

export interface RangeDialogProps {
  state: RangeDialogState | null
  ranges: readonly AdminAvailabilityRange[]
  onClose: () => void
}

/** Add / edit / delete an availability range (start, end ≥ start, busy/available, private note; overlap warning). */
export function RangeDialog({ state, ranges, onClose }: RangeDialogProps) {
  const t = useTranslations('adminContent.availability.form')
  const close = async () => {
    if (await confirmDiscardChanges()) onClose()
  }
  const key = state ? (state.mode === 'edit' ? state.range.id : `new-${state.startDate}`) : 'closed'
  return (
    <Modal
      open={state !== null}
      onClose={() => void close()}
      size="md"
      icon={state?.mode === 'edit' ? 'edit_calendar' : 'calendar_add_on'}
      title={state?.mode === 'edit' ? t('editTitle') : t('newTitle')}
      description={t('description')}
      dismissible={false}
    >
      {state && <RangeFormView key={key} state={state} ranges={ranges} onDone={onClose} />}
    </Modal>
  )
}

function RangeFormView({
  state,
  ranges,
  onDone,
}: {
  state: RangeDialogState
  ranges: readonly AdminAvailabilityRange[]
  onDone: () => void
}) {
  const t = useTranslations('adminContent.availability')
  const tf = useTranslations('adminContent.availability.form')
  const tc = useTranslations('adminContent.common')
  const fmt = useRangeFormat()
  const confirm = useConfirm()
  const describe = useAdminErrorMessage()
  const range = state.mode === 'edit' ? state.range : null
  const [initial] = useState<RangeForm>(() =>
    range
      ? { startDate: range.startDate, endDate: range.endDate, type: range.type, note: range.note ?? '' }
      : { startDate: state.mode === 'new' ? state.startDate : '', endDate: state.mode === 'new' ? state.startDate : '', type: 'busy', note: '' },
  )
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial])
  useUnsavedChanges(dirty && !saving && !deleting)

  const set = <K extends keyof RangeForm>(key: K, value: RangeForm[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      // Moving the start past the end drags the end along (keeps the range valid while picking dates).
      if (key === 'startDate' && typeof value === 'string' && value && (!prev.endDate || prev.endDate < value)) next.endDate = value
      return next
    })
    setErrors((prev) => {
      const { [key]: _removed, ...rest } = prev
      return rest
    })
  }

  const valid = form.startDate && form.endDate && form.endDate >= form.startDate
  const conflicts = valid
    ? ranges.filter((r) => r.id !== range?.id && overlaps(r, { startDate: form.startDate, endDate: form.endDate }))
    : []

  const save = async () => {
    const errs: Record<string, string> = {}
    if (!form.startDate) errs.startDate = tf('errors.required')
    if (!form.endDate) errs.endDate = tf('errors.required')
    else if (form.startDate && form.endDate < form.startDate) errs.endDate = tf('errors.endBeforeStart')
    if (Object.keys(errs).length) {
      setErrors(errs)
      requestAnimationFrame(() => document.querySelector<HTMLElement>('dialog[open] [aria-invalid="true"]')?.focus())
      return
    }
    setSaving(true)
    const body = { startDate: form.startDate, endDate: form.endDate, type: form.type, note: form.note.trim() || null }
    try {
      if (range) await availabilityApi.update(range.id, body)
      else await availabilityApi.create(body)
      toast.success(range ? tf('savedToast') : tf('createdToast'), fmt.range(form.startDate, form.endDate))
      invalidateAdminQueries('availability')
      skipUnsavedCheck()
      onDone()
    } catch (raw) {
      const error = toAdminApiError(raw)
      if (error.isValidationError) setErrors(error.fieldErrors)
      toast.error(describe(error))
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    if (!range) return
    const ok = await confirm({
      title: t('deleteTitle'),
      body: t('deleteBody', { range: fmt.range(range.startDate, range.endDate), type: t(`calendar.types.${range.type}`) }),
      confirmLabel: t('deleteConfirm'),
      tone: 'danger',
      icon: 'delete',
    })
    if (!ok) return
    setDeleting(true)
    try {
      await availabilityApi.remove(range.id)
      toast.success(t('deletedToast'))
      invalidateAdminQueries('availability')
      skipUnsavedCheck()
      onDone()
    } catch (raw) {
      toast.error(describe(raw))
      setDeleting(false)
    }
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DateField label={tf('fields.start')} required value={form.startDate} onChange={(v) => set('startDate', v)} error={errors.startDate} />
        <DateField
          label={tf('fields.end')}
          required
          value={form.endDate}
          min={form.startDate || undefined}
          onChange={(v) => set('endDate', v)}
          error={errors.endDate}
        />
      </div>
      {valid && (
        <p className="-mt-1 font-caption text-caption text-on-surface-variant" aria-live="polite">
          {tf('length', { days: rangeDays(form.startDate, form.endDate), range: fmt.range(form.startDate, form.endDate) })}
        </p>
      )}

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 font-body-md text-[13px] font-semibold text-on-surface">{tf('fields.type')}</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(['busy', 'available'] as const).map((type) => {
            const active = form.type === type
            return (
              <label
                key={type}
                className={cn(
                  'flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-primary',
                  active
                    ? type === 'busy'
                      ? 'border-secondary bg-secondary-fixed/50'
                      : 'border-tertiary bg-tertiary-fixed/50'
                    : 'border-outline-variant hover:bg-surface-container-low',
                )}
              >
                <input
                  type="radio"
                  name="range-type"
                  value={type}
                  checked={active}
                  onChange={() => set('type', type)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span className="flex flex-col">
                  <span className="font-body-md text-body-md font-semibold text-on-surface">{t(`calendar.types.${type}`)}</span>
                  <span className="font-caption text-caption text-on-surface-variant">{tf(`typeHints.${type}`)}</span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <TextArea
        label={tf('fields.note')}
        value={form.note}
        rows={3}
        maxLength={500}
        counter
        placeholder={tf('notePlaceholder')}
        hint={tf('noteHint')}
        onChange={(e) => set('note', e.target.value)}
        error={errors.note}
      />

      {conflicts.length > 0 && (
        <div role="status" className="flex gap-2.5 rounded-xl border border-secondary-fixed-dim bg-secondary-fixed/40 p-3">
          <Icon name="warning" className="mt-0.5 shrink-0 text-[20px] text-secondary" />
          <div className="flex flex-col gap-1 font-body-md text-body-md">
            <p className="font-semibold text-on-surface">{tf('overlapTitle', { count: conflicts.length })}</p>
            <ul className="flex flex-col gap-0.5 text-on-surface-variant">
              {conflicts.map((c) => (
                <li key={c.id}>
                  {t(`calendar.types.${c.type}`)} · {fmt.range(c.startDate, c.endDate)}
                  {c.note ? ` — ${c.note}` : ''}
                </li>
              ))}
            </ul>
            <p className="font-caption text-caption text-on-surface-variant">{tf('overlapHint')}</p>
          </div>
        </div>
      )}

      <div className="sticky -bottom-4 z-10 -mx-5 -mb-4 mt-1 flex flex-wrap items-center gap-2 border-t border-surface-container bg-surface-container-lowest px-5 py-3">
        {range && (
          <Button variant="dangerGhost" icon="delete" onClick={() => void onDelete()} loading={deleting}>
            {tf('delete')}
          </Button>
        )}
        <span className="ml-auto" />
        <Button variant="ghost" onClick={() => void confirmDiscardChanges().then((ok) => ok && onDone())}>
          {tc('cancel')}
        </Button>
        <Button type="submit" variant="primary" icon="save" loading={saving} disabled={!dirty && range !== null}>
          {range ? tf('save') : tf('create')}
        </Button>
      </div>
    </form>
  )
}
