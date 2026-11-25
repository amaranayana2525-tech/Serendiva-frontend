'use client'

import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  /** Unique column key. */
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  /** Extra classes for th + td (width, nowrap…). */
  className?: string
  align?: 'left' | 'right' | 'center'
  /**
   * The row's main column: its content becomes the row's keyboard-accessible button (when `onRowClick` is set) and
   * the card title on phones.
   */
  primary?: boolean
  /** Card layout on phones: 'meta' (label + value row, default), 'subtitle' (under the title), 'badge' (top right), 'hidden'. */
  mobile?: 'meta' | 'subtitle' | 'badge' | 'hidden'
  /** Hide the column on narrower desktops (still shown in phone cards). */
  hideBelow?: 'lg' | 'xl'
}

export interface DataTableSelection {
  selected: ReadonlySet<string>
  onChange: (next: Set<string>) => void
}

export interface DataTableProps<T> {
  columns: readonly DataTableColumn<T>[]
  /** undefined while the first load is running. */
  rows: readonly T[] | undefined
  getRowId: (row: T) => string
  /** Accessible caption (visually hidden). */
  caption: string
  onRowClick?: (row: T) => void
  /** Label for the row's open button ("Open inquiry SRD-2026-0001"); defaults to the primary cell text. */
  rowLabel?: (row: T) => string
  /** Highlight a row (e.g. the one shown in the drawer). */
  activeRowId?: string | null
  /** Optional checkbox selection. */
  selection?: DataTableSelection
  /** First load → skeleton rows. */
  loading?: boolean
  /** Refetching → rows dimmed. */
  fetching?: boolean
  /** Shown when rows is an empty array (use <EmptyPanel/>). */
  empty?: ReactNode
  /** Number of skeleton rows. */
  skeletonRows?: number
  /** Custom phone card (default: built from the columns). */
  renderCard?: (row: T) => ReactNode
  id?: string
  className?: string
}

const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' } as const
const hideClass = { lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell' } as const
const INTERACTIVE = 'a,button,input,select,textarea,label,summary,[role="button"],[data-row-ignore]'

/** True when the click started on a nested control (so the row click must not fire). */
function fromNestedControl(event: MouseEvent, rowButton: HTMLElement | null): boolean {
  const target = event.target instanceof Element ? event.target.closest(INTERACTIVE) : null
  return Boolean(target && target !== rowButton && !rowButton?.contains(target))
}

function HeaderCheckbox({ ids, selection, label }: { ids: string[]; selection: DataTableSelection; label: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const count = ids.filter((id) => selection.selected.has(id)).length
  const all = ids.length > 0 && count === ids.length
  const some = count > 0 && !all
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = some
  }, [some])
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      checked={all}
      onChange={(e) => {
        const next = new Set(selection.selected)
        for (const id of ids) {
          if (e.target.checked) next.add(id)
          else next.delete(id)
        }
        selection.onChange(next)
      }}
      className="h-4 w-4 cursor-pointer rounded accent-primary"
    />
  )
}

/**
 * Generic admin table: column config, row click (mouse anywhere / keyboard on the primary cell), optional selection,
 * skeleton, empty state, and a card list below 768 px.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  caption,
  onRowClick,
  rowLabel,
  activeRowId,
  selection,
  loading = false,
  fetching = false,
  empty,
  skeletonRows = 8,
  renderCard,
  id,
  className,
}: DataTableProps<T>) {
  const t = useTranslations('admin.kit.table')
  const primary = columns.find((c) => c.primary) ?? columns[0]
  const ids = rows?.map(getRowId) ?? []

  const toggleRow = (rowId: string, checked: boolean) => {
    if (!selection) return
    const next = new Set(selection.selected)
    if (checked) next.add(rowId)
    else next.delete(rowId)
    selection.onChange(next)
  }

  const primaryContent = (row: T) => {
    const content = primary.cell(row)
    if (!onRowClick) return content
    return (
      <button
        type="button"
        data-row-button=""
        onClick={() => onRowClick(row)}
        aria-label={rowLabel?.(row)}
        className="rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {content}
      </button>
    )
  }

  if (!loading && rows && rows.length === 0) {
    return (
      <div id={id} className={className}>
        {empty}
      </div>
    )
  }

  const skeleton = loading || !rows
  return (
    <div id={id} className={cn('relative', className)} aria-busy={fetching || skeleton || undefined}>
      {/* ≥ md: table */}
      <div className="relative hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-surface-container-high">
              {selection && (
                <th scope="col" className="w-10 px-3 py-2.5">
                  <HeaderCheckbox ids={ids} selection={selection} label={t('selectAll')} />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'whitespace-nowrap px-2.5 py-2.5 font-body-md text-[12px] font-semibold uppercase tracking-wide text-on-surface-variant',
                    alignClass[col.align ?? 'left'],
                    col.hideBelow && hideClass[col.hideBelow],
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn(fetching && !skeleton && 'opacity-60 transition-opacity')}>
            {skeleton
              ? Array.from({ length: skeletonRows }, (_, i) => (
                  <tr key={i} className="border-b border-surface-container" aria-hidden="true">
                    {selection && <td className="px-3 py-3.5" />}
                    {columns.map((col) => (
                      <td key={col.key} className={cn('px-3 py-3.5', col.hideBelow && hideClass[col.hideBelow])}>
                        <span className="block h-4 w-full max-w-[10rem] animate-pulse rounded bg-surface-container-high/80" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => {
                  const rowId = getRowId(row)
                  const active = activeRowId === rowId
                  return (
                    <tr
                      key={rowId}
                      onClick={
                        onRowClick
                          ? (e) => {
                              const button = (e.currentTarget as HTMLElement).querySelector<HTMLElement>('[data-row-button]')
                              if (!fromNestedControl(e, button)) onRowClick(row)
                            }
                          : undefined
                      }
                      className={cn(
                        'border-b border-surface-container align-top transition-colors last:border-b-0',
                        onRowClick && 'cursor-pointer hover:bg-surface-container-low',
                        active && 'bg-primary-fixed/25 hover:bg-primary-fixed/30',
                        selection?.selected.has(rowId) && 'bg-surface-container-low',
                      )}
                    >
                      {selection && (
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            aria-label={t('selectRow', { row: rowLabel?.(row) ?? rowId })}
                            checked={selection.selected.has(rowId)}
                            onChange={(e) => toggleRow(rowId, e.target.checked)}
                            className="h-4 w-4 cursor-pointer rounded accent-primary"
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            'px-2.5 py-3 font-body-md text-body-md text-on-surface',
                            alignClass[col.align ?? 'left'],
                            col.hideBelow && hideClass[col.hideBelow],
                            col.className,
                          )}
                        >
                          {col === primary ? primaryContent(row) : col.cell(row)}
                        </td>
                      ))}
                    </tr>
                  )
                })}
          </tbody>
        </table>
      </div>

      {/* < md: cards */}
      <ul className={cn('flex flex-col gap-2 md:hidden', fetching && !skeleton && 'opacity-60')} aria-label={caption}>
        {skeleton
          ? Array.from({ length: Math.min(skeletonRows, 5) }, (_, i) => (
              <li key={i} aria-hidden="true" className="flex flex-col gap-2 rounded-xl border border-surface-container p-3">
                <span className="block h-4 w-1/2 animate-pulse rounded bg-surface-container-high/80" />
                <span className="block h-3 w-3/4 animate-pulse rounded bg-surface-container-high/80" />
                <span className="block h-3 w-2/3 animate-pulse rounded bg-surface-container-high/80" />
              </li>
            ))
          : rows.map((row) => {
              const rowId = getRowId(row)
              const active = activeRowId === rowId
              const badges = columns.filter((c) => c.mobile === 'badge')
              const subtitles = columns.filter((c) => c.mobile === 'subtitle')
              const metas = columns.filter((c) => c !== primary && (c.mobile ?? 'meta') === 'meta')
              return (
                <li
                  key={rowId}
                  onClick={
                    onRowClick
                      ? (e) => {
                          const button = (e.currentTarget as HTMLElement).querySelector<HTMLElement>('[data-row-button]')
                          if (!fromNestedControl(e, button)) onRowClick(row)
                        }
                      : undefined
                  }
                  className={cn(
                    'rounded-xl border bg-surface-container-lowest p-3 transition-colors',
                    onRowClick && 'cursor-pointer active:bg-surface-container-low',
                    active ? 'border-primary/50 bg-primary-fixed/20' : 'border-surface-container-high',
                  )}
                >
                  {renderCard ? (
                    <>
                      {renderCard(row)}
                      {onRowClick && (
                        <button
                          type="button"
                          data-row-button=""
                          onClick={() => onRowClick(row)}
                          className="sr-only focus:not-sr-only"
                        >
                          {rowLabel?.(row) ?? t('open')}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2">
                          {selection && (
                            <input
                              type="checkbox"
                              aria-label={t('selectRow', { row: rowLabel?.(row) ?? rowId })}
                              checked={selection.selected.has(rowId)}
                              onChange={(e) => toggleRow(rowId, e.target.checked)}
                              className="mt-1 h-4 w-4 cursor-pointer rounded accent-primary"
                            />
                          )}
                          <div className="min-w-0 font-body-md text-body-md text-on-surface">{primaryContent(row)}</div>
                        </div>
                        {badges.length > 0 && (
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {badges.map((c) => (
                              <span key={c.key}>{c.cell(row)}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {subtitles.map((c) => (
                        <div key={c.key} className="font-body-md text-body-md text-on-surface-variant">
                          {c.cell(row)}
                        </div>
                      ))}
                      {metas.length > 0 && (
                        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 pt-0.5">
                          {metas.map((c) => (
                            <div key={c.key} className="contents">
                              <dt className="font-caption text-caption text-on-surface-variant">{c.header}</dt>
                              <dd className="min-w-0 font-caption text-caption text-on-surface">{c.cell(row)}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
      </ul>
    </div>
  )
}
