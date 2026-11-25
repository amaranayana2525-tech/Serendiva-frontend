'use client'

import { useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import { CopyButton, CsvExportButton } from '@/components/admin/kit/actions'
import { AdminPagination } from '@/components/admin/kit/AdminPagination'
import { Button, IconButton } from '@/components/admin/kit/Button'
import { useConfirm } from '@/components/admin/kit/ConfirmDialog'
import { DataTable, type DataTableColumn } from '@/components/admin/kit/DataTable'
import { FilterBar, FilterTabs } from '@/components/admin/kit/FilterBar'
import { PageHeader } from '@/components/admin/kit/PageHeader'
import { EmptyPanel, ErrorPanel } from '@/components/admin/kit/Panels'
import { StatusBadge, useStatusLabel } from '@/components/admin/kit/StatusBadge'
import { adminApi, cleanQuery, unwrap } from '@/lib/admin/client'
import { invalidateAdminQueries, useAdminErrorMessage, useAdminQuery } from '@/lib/admin/hooks'
import { toast } from '@/lib/admin/toast'
import { useUrlState } from '@/lib/admin/url-state'
import { isAdminLocale } from '@/lib/admin/translatable'
import type { AdminSubscriber, SubscriberStatus } from '@/lib/api/types'

const DEFAULTS = { status: '', q: '', page: '1' }
const PAGE_SIZE = 50
const STATUSES: readonly SubscriberStatus[] = ['confirmed', 'pending', 'unsubscribed']
const isStatus = (v: string): v is SubscriberStatus => (STATUSES as readonly string[]).includes(v)

/** /admin/newsletter — subscribers with status tabs + counts, search, pagination, CSV export and delete. */
export function NewsletterScreen() {
  const t = useTranslations('adminLibrary.newsletter')
  const statusLabel = useStatusLabel()
  const tl = useTranslations('admin.kit.locales')
  const format = useFormatter()
  const describe = useAdminErrorMessage()
  const confirm = useConfirm()
  const filters = useUrlState(DEFAULTS)
  const [busy, setBusy] = useState<string | null>(null)

  const { status: rawStatus, q, page: rawPage } = filters.values
  const status = isStatus(rawStatus) ? rawStatus : undefined
  const page = Math.max(1, Number.parseInt(rawPage, 10) || 1)
  const query = { status, q, page, pageSize: PAGE_SIZE }
  const list = useAdminQuery(['newsletter', query], (signal) =>
    unwrap(adminApi.GET('/api/v1/admin/newsletter', { params: { query: cleanQuery(query) }, signal })),
  )
  const counts = list.data?.counts

  const date = (iso: string | null) =>
    iso ? format.dateTime(new Date(iso), { day: 'numeric', month: 'short', year: 'numeric' }) : null

  const remove = async (row: AdminSubscriber) => {
    const ok = await confirm({
      title: t('deleteTitle'),
      body: t('deleteBody', { email: row.email }),
      confirmLabel: t('delete'),
      tone: 'danger',
      icon: 'delete',
    })
    if (!ok) return
    setBusy(row.id)
    try {
      await unwrap(adminApi.DELETE('/api/v1/admin/newsletter/{id}', { params: { path: { id: row.id } } }))
      toast.success(t('deleted'), row.email)
      invalidateAdminQueries(['newsletter', 'stats', 'dashboard'])
    } catch (error) {
      toast.error(t('deleteFailed'), describe(error))
    } finally {
      setBusy(null)
    }
  }

  const columns: DataTableColumn<AdminSubscriber>[] = [
    {
      key: 'email',
      header: t('columns.email'),
      primary: true,
      className: 'min-w-[14rem]',
      cell: (row) => (
        <span className="flex min-w-0 items-center gap-1">
          <span className="break-all font-medium text-primary">{row.email}</span>
          <CopyButton value={row.email} label={t('copyEmail', { email: row.email })} className="h-7 w-7 shrink-0" />
        </span>
      ),
    },
    {
      key: 'status',
      header: t('columns.status'),
      mobile: 'badge',
      cell: (row) => <StatusBadge kind="subscriber" status={row.status} />,
    },
    {
      key: 'locale',
      header: t('columns.locale'),
      cell: (row) => (
        <span className="rounded bg-surface-container px-1.5 py-px font-body-md text-[12px] font-semibold text-on-surface-variant">
          {isAdminLocale(row.locale) ? tl(`${row.locale}.short`) : row.locale.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'source',
      header: t('columns.source'),
      cell: (row) =>
        row.source ? <span className="break-words">{row.source}</span> : <span className="text-outline">—</span>,
    },
    {
      key: 'subscribed',
      header: t('columns.subscribed'),
      cell: (row) => <span className="whitespace-nowrap">{date(row.createdAt)}</span>,
    },
    {
      key: 'since',
      header: t('columns.statusSince'),
      hideBelow: 'lg',
      cell: (row) => {
        const value =
          row.status === 'confirmed' ? row.confirmedAt : row.status === 'unsubscribed' ? row.unsubscribedAt : null
        return value ? (
          <span className="whitespace-nowrap">{date(value)}</span>
        ) : (
          <span className="text-outline">{row.status === 'pending' ? t('awaiting') : '—'}</span>
        )
      },
    },
    {
      key: 'actions',
      header: <span className="sr-only">{t('columns.actions')}</span>,
      align: 'right',
      cell: (row) => (
        <IconButton
          icon="delete"
          size="sm"
          variant="danger"
          label={t('deleteRow', { email: row.email })}
          disabled={busy === row.id}
          onClick={() => void remove(row)}
        />
      ),
    },
  ]

  const exportStatus = status ?? 'all'
  const exportCount = status ? counts?.[status] : counts?.total

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <CsvExportButton
            resource="newsletter"
            query={{ status: exportStatus, q }}
            label={
              exportCount !== undefined
                ? t('exportCount', {
                    count: exportCount,
                    status: status ? statusLabel('subscriber', status) : t('tabs.all'),
                  })
                : t('export')
            }
          />
        }
      />

      <div className="shadow-ambient flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 md:p-5">
        <FilterTabs
          label={t('statusTabs')}
          controlsId="newsletter-results"
          value={status ?? ''}
          onChange={(value) => filters.set({ status: value })}
          tabs={[
            { value: '', label: t('tabs.all'), count: counts?.total },
            ...STATUSES.map((s) => ({ value: s, label: statusLabel('subscriber', s), count: counts?.[s] })),
          ]}
        />
        <FilterBar
          state={filters}
          fields={[{ type: 'search', key: 'q', label: t('search'), placeholder: t('searchPlaceholder') }]}
        />

        {list.error && !list.data ? (
          <ErrorPanel error={list.error} onRetry={() => void list.refetch()} variant="inline" />
        ) : (
          <DataTable
            id="newsletter-results"
            caption={t('tableCaption')}
            columns={columns}
            rows={list.data?.items}
            loading={list.loading}
            fetching={list.fetching}
            getRowId={(row) => row.id}
            rowLabel={(row) => row.email}
            empty={
              filters.isDefault() ? (
                <EmptyPanel icon="mail" title={t('emptyTitle')} body={t('emptyBody')} />
              ) : (
                <EmptyPanel
                  icon="filter_alt_off"
                  title={t('noMatchesTitle')}
                  body={t('noMatchesBody')}
                  action={
                    <Button icon="filter_alt_off" onClick={() => filters.reset()}>
                      {t('clearFilters')}
                    </Button>
                  }
                />
              )
            }
          />
        )}

        {list.data && list.data.meta.total > 0 && (
          <AdminPagination
            page={list.data.meta.page}
            totalPages={list.data.meta.totalPages}
            total={list.data.meta.total}
            pageSize={list.data.meta.pageSize}
            onPageChange={(p) => filters.set({ page: String(p) })}
          />
        )}
      </div>
    </>
  )
}
