'use client'

import { useTranslations } from 'next-intl'
import { CsvExportButton } from '@/components/admin/kit/actions'
import { AdminPagination } from '@/components/admin/kit/AdminPagination'
import { Button } from '@/components/admin/kit/Button'
import { DataTable, type DataTableColumn } from '@/components/admin/kit/DataTable'
import { FilterBar, FilterTabs } from '@/components/admin/kit/FilterBar'
import { PageHeader } from '@/components/admin/kit/PageHeader'
import { EmptyPanel, ErrorPanel } from '@/components/admin/kit/Panels'
import { StatusBadge } from '@/components/admin/kit/StatusBadge'
import { Icon } from '@/components/ui/Icon'
import { useAdminQuery } from '@/lib/admin/hooks'
import { isLeadDue, isLeadSort, isLeadStatus, LEAD_PAGE_SIZE, LEAD_STATUSES, proposalsApi } from '@/lib/admin/leads'
import { useDrawerParam, useUrlState } from '@/lib/admin/url-state'
import type { AdminProposalListItem } from '@/lib/api/types'
import { ProposalDrawer } from './ProposalDrawer'
import { useLeadFormat } from './useLeadFormat'

const DEFAULTS = { status: '', q: '', from: '', to: '', due: '', sort: '', guideEmail: '', page: '1' }

/** /admin/proposals — corporate proposal requests: same pattern as inquiries (+ attachment download in the drawer). */
export function ProposalsScreen() {
  const t = useTranslations('admin.proposals')
  const tl = useTranslations('admin.leads')
  const f = useLeadFormat()
  const filters = useUrlState(DEFAULTS)
  const drawer = useDrawerParam('id')

  const { status: rawStatus, q, from, to, due: rawDue, sort: rawSort, guideEmail: rawGuideEmail, page: rawPage } = filters.values
  const status = isLeadStatus(rawStatus) ? rawStatus : undefined
  const due = isLeadDue(rawDue) ? rawDue : undefined
  const sort = isLeadSort(rawSort) ? rawSort : undefined
  const guideEmail = rawGuideEmail === 'missing' ? ('missing' as const) : undefined
  const page = Math.max(1, Number.parseInt(rawPage, 10) || 1)
  const exportQuery = { status, q, from, to, due, sort }
  const query = { ...exportQuery, guideEmail, page, pageSize: LEAD_PAGE_SIZE }
  const list = useAdminQuery(['proposals', query], (signal) => proposalsApi.list(query, signal))
  const counts = list.data?.counts

  const columns: DataTableColumn<AdminProposalListItem>[] = [
    {
      key: 'company',
      header: t('columns.company'),
      primary: true,
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="flex items-center gap-1.5 font-semibold text-primary">
            {row.company}
            {row.replyOverdue && <Icon name="schedule" className="text-[15px] text-error" label={tl('overdue')} />}
            {row.hasNotes && <Icon name="sticky_note_2" className="text-[15px] text-secondary" label={tl('hasNotes')} />}
            {row.hasAttachment && <Icon name="attach_file" className="text-[15px] text-on-surface-variant" label={t('hasAttachment')} />}
            {row.emailStatus !== 'sent' && row.emailStatus !== 'pending' && (
              <Icon name="mail_lock" className="text-[15px] text-error" label={tl('emailProblem')} />
            )}
          </span>
          <span className="truncate font-caption text-caption text-on-surface-variant">{row.contactPerson}</span>
          {row.followUpAt && (
            <span className="font-caption text-caption font-medium text-secondary">
              {tl('followUpBadge', { date: f.calendarDate(row.followUpAt) })}
            </span>
          )}
        </span>
      ),
      className: 'min-w-[12rem]',
    },
    {
      key: 'reference',
      header: tl('columns.reference'),
      cell: (row) => <span className="whitespace-nowrap font-mono text-[12px] text-on-surface-variant">{row.reference}</span>,
    },
    { key: 'groupSize', header: t('columns.groupSize'), cell: (row) => row.groupSize, className: 'whitespace-nowrap' },
    { key: 'dates', header: t('columns.dates'), cell: (row) => <span className="block min-w-[7rem] max-w-[12rem]">{row.dates}</span> },
    { key: 'eventType', header: t('columns.eventType'), cell: (row) => <span className="block max-w-[10rem]">{row.eventType}</span> },
    {
      key: 'received',
      header: tl('columns.received'),
      cell: (row) => (
        <span className="flex flex-col whitespace-nowrap" title={f.dateTime(row.createdAt)}>
          <span>{f.date(row.createdAt)}</span>
          <span className="font-caption text-caption text-on-surface-variant">{f.relative(row.createdAt)}</span>
        </span>
      ),
    },
    { key: 'status', header: tl('columns.status'), cell: (row) => <StatusBadge kind="lead" status={row.status} />, mobile: 'badge' },
    {
      key: 'email',
      header: tl('columns.email'),
      cell: (row) => <StatusBadge kind="email" status={row.emailStatus} noIcon />,
      hideBelow: 'xl',
      mobile: 'hidden',
    },
  ]

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={<CsvExportButton resource="proposals" query={exportQuery} />}
      />
      <div className="shadow-ambient flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 md:p-5">
        <FilterTabs
          label={tl('statusTabs')}
          controlsId="proposals-results"
          value={status ?? ''}
          onChange={(value) => filters.set({ status: value })}
          tabs={[
            { value: '', label: tl('tabs.all'), count: counts?.total },
            ...LEAD_STATUSES.map((s) => ({ value: s, label: tl(`tabs.${s}`), count: counts?.[s] })),
          ]}
        />
        {due && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-secondary-fixed/50 px-3 py-2 font-body-md text-body-md text-on-secondary-fixed-variant">
            <Icon name="schedule" className="text-[18px]" />
            <span className="mr-auto">{due === 'reply' ? tl('dueReplyFilter') : tl('dueFollowUpFilter')}</span>
            <Button size="sm" variant="ghost" icon="close" onClick={() => filters.set({ due: '' })}>
              {tl('clearFilters')}
            </Button>
          </div>
        )}
        {guideEmail && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-error-container px-3 py-2 font-body-md text-body-md text-on-error-container">
            <Icon name="mail_lock" className="text-[18px]" />
            <span className="mr-auto">{t('guideEmailFilter')}</span>
            <Button size="sm" variant="ghost" icon="close" onClick={() => filters.set({ guideEmail: '' })}>
              {tl('clearFilters')}
            </Button>
          </div>
        )}
        <FilterBar
          state={filters}
          fields={[
            { type: 'search', key: 'q', label: tl('filters.search'), placeholder: t('searchPlaceholder') },
            {
              type: 'select',
              key: 'due',
              label: tl('filters.due'),
              allLabel: tl('filters.dueAll'),
              options: [
                { value: 'reply', label: tl('filters.dueReply') },
                { value: 'followUp', label: tl('filters.dueFollowUp') },
              ],
            },
            { type: 'dateRange', fromKey: 'from', toKey: 'to', label: tl('filters.received') },
            {
              type: 'select',
              key: 'sort',
              label: tl('filters.sort'),
              allLabel: tl('filters.sortNewest'),
              options: [{ value: 'oldest', label: tl('filters.sortOldest') }],
            },
          ]}
        />
        {list.error && !list.data ? (
          <ErrorPanel error={list.error} onRetry={() => void list.refetch()} variant="inline" />
        ) : (
          <DataTable
            id="proposals-results"
            caption={t('tableCaption')}
            columns={columns}
            rows={list.data?.items}
            loading={list.loading}
            fetching={list.fetching}
            getRowId={(row) => row.id}
            onRowClick={(row) => drawer.open(row.id)}
            rowLabel={(row) => tl('openRow', { name: row.company, reference: row.reference })}
            activeRowId={drawer.id}
            empty={
              filters.isDefault() ? (
                <EmptyPanel icon="business_center" title={t('emptyTitle')} body={t('emptyBody')} />
              ) : (
                <EmptyPanel
                  icon="filter_alt_off"
                  title={tl('noMatchesTitle')}
                  body={tl('noMatchesBody')}
                  action={
                    <Button icon="filter_alt_off" onClick={() => filters.reset()}>
                      {tl('clearFilters')}
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
      <ProposalDrawer id={drawer.id} onClose={drawer.close} />
    </>
  )
}
