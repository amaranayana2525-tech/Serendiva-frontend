'use client'

import { useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import { AdminPagination } from '@/components/admin/kit/AdminPagination'
import { Button, IconButton } from '@/components/admin/kit/Button'
import { useConfirm } from '@/components/admin/kit/ConfirmDialog'
import { DataTable, type DataTableColumn } from '@/components/admin/kit/DataTable'
import { FilterBar, FilterTabs } from '@/components/admin/kit/FilterBar'
import { Switch } from '@/components/admin/kit/form/Switch'
import { MediaThumb } from '@/components/admin/kit/media/MediaThumb'
import { PageHeader } from '@/components/admin/kit/PageHeader'
import { EmptyPanel, ErrorPanel } from '@/components/admin/kit/Panels'
import { StatusBadge } from '@/components/admin/kit/StatusBadge'
import { Icon } from '@/components/ui/Icon'
import { useAdminErrorMessage, useAdminQuery } from '@/lib/admin/hooks'
import { toast } from '@/lib/admin/toast'
import { useAdminRouter } from '@/lib/admin/unsaved'
import { useUrlState } from '@/lib/admin/url-state'
import type { AdminBlogListItem } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import {
  BLOG_PAGE_SIZE,
  blogApi,
  loadBlogTaxonomy,
  publicPostPath,
  type BlogListFilters,
  type BlogStatus,
} from './blogApi'

const DEFAULTS = { status: '', q: '', category: '', page: '1' }

/** /admin/blog — posts with search, status tabs, category filter, publish toggle, view on site and delete. */
export function BlogListScreen() {
  const t = useTranslations('adminLibrary.blog')
  const format = useFormatter()
  const describe = useAdminErrorMessage()
  const confirm = useConfirm()
  const router = useAdminRouter()
  const filters = useUrlState(DEFAULTS)
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set())

  const { status: rawStatus, q, category, page: rawPage } = filters.values
  const status: BlogStatus | undefined = rawStatus === 'draft' || rawStatus === 'published' ? rawStatus : undefined
  const page = Math.max(1, Number.parseInt(rawPage, 10) || 1)
  const query: BlogListFilters = { q, status, category, page, pageSize: BLOG_PAGE_SIZE }
  const list = useAdminQuery(['blog', query], (signal) => blogApi.list(query, signal))
  const taxonomy = useAdminQuery(['blog', 'taxonomy'], (signal) => loadBlogTaxonomy(signal))

  const markBusy = (id: string, on: boolean) =>
    setBusy((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  const setPublished = async (row: AdminBlogListItem, published: boolean) => {
    const next: BlogStatus = published ? 'published' : 'draft'
    list.setData((prev) =>
      prev ? { ...prev, items: prev.items.map((p) => (p.id === row.id ? { ...p, status: next } : p)) } : prev,
    )
    markBusy(row.id, true)
    try {
      const saved = await blogApi.setStatus(row.id, next)
      list.setData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((p) =>
                p.id === row.id ? { ...p, status: saved.status, publishedAt: saved.publishedAt } : p,
              ),
            }
          : prev,
      )
      toast.success(published ? t('publishedToast') : t('unpublishedToast'), row.title)
      if (status) void list.refetch()
    } catch (error) {
      list.setData((prev) => (prev ? { ...prev, items: prev.items.map((p) => (p.id === row.id ? row : p)) } : prev))
      toast.error(t('statusFailed'), describe(error))
    } finally {
      markBusy(row.id, false)
    }
  }

  const remove = async (row: AdminBlogListItem) => {
    const ok = await confirm({
      title: t('deleteTitle'),
      body: t('deleteBody', { title: row.title }),
      confirmLabel: t('delete'),
      tone: 'danger',
      icon: 'delete',
    })
    if (!ok) return
    markBusy(row.id, true)
    try {
      await blogApi.remove(row.id)
      toast.success(t('deleted'), row.title)
      void list.refetch()
      void taxonomy.refetch()
    } catch (error) {
      toast.error(t('deleteFailed'), describe(error))
    } finally {
      markBusy(row.id, false)
    }
  }

  const date = (iso: string | null) =>
    iso ? format.dateTime(new Date(iso), { day: 'numeric', month: 'short', year: 'numeric' }) : null

  const columns: DataTableColumn<AdminBlogListItem>[] = [
    {
      key: 'title',
      header: t('columns.post'),
      primary: true,
      className: 'min-w-[16rem]',
      cell: (row) => (
        <span className="flex min-w-0 items-start gap-3">
          <span className="relative hidden h-12 w-16 shrink-0 overflow-hidden rounded-md bg-surface-container sm:block">
            {row.cover ? (
              <MediaThumb media={row.cover} alt="" sizes="64px" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-outline">
                <Icon name="hide_image" className="text-[20px]" />
              </span>
            )}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="flex items-center gap-1.5 font-semibold text-primary">
              {row.title}
              {row.isFeatured && (
                <Icon name="star" filled className="shrink-0 text-[16px] text-secondary" label={t('featured')} />
              )}
            </span>
            <span className="break-all font-mono text-[12px] text-on-surface-variant">/{row.slug}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'category',
      header: t('columns.category'),
      cell: (row) => <span className="whitespace-nowrap">{row.categoryLabel}</span>,
      mobile: 'subtitle',
    },
    {
      key: 'status',
      header: t('columns.status'),
      mobile: 'badge',
      cell: (row) => <StatusBadge kind="content" status={row.status} />,
    },
    {
      key: 'published',
      header: t('columns.published'),
      cell: (row) =>
        row.publishedAt ? (
          <span className="whitespace-nowrap">{date(row.publishedAt)}</span>
        ) : (
          <span className="text-outline">{t('notPublished')}</span>
        ),
    },
    {
      key: 'translations',
      header: t('columns.translations'),
      hideBelow: 'xl',
      cell: (row) => (
        <span className="flex items-center gap-1 whitespace-nowrap">
          {(['en', 'zh', 'de'] as const).map((l) => {
            const has = l === 'en' || row.translations[l as 'zh' | 'de']
            return (
              <span
                key={l}
                title={
                  has ? t('translated', { locale: l.toUpperCase() }) : t('notTranslated', { locale: l.toUpperCase() })
                }
                className={cn(
                  'rounded px-1.5 py-px font-body-md text-[11px] font-semibold',
                  has
                    ? 'bg-tertiary-fixed/70 text-on-tertiary-fixed-variant'
                    : 'bg-surface-container text-outline line-through',
                )}
              >
                {l === 'zh' ? '中文' : l.toUpperCase()}
                <span className="sr-only">: {has ? t('yes') : t('no')}</span>
              </span>
            )
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">{t('columns.actions')}</span>,
      align: 'right',
      cell: (row) => (
        <span className="flex items-center justify-end gap-1">
          <Switch
            size="sm"
            checked={row.status === 'published'}
            disabled={busy.has(row.id)}
            onCheckedChange={(v) => void setPublished(row, v)}
            label={t('publishToggle', { title: row.title })}
            hideLabel
          />
          {row.status === 'published' ? (
            <a
              href={publicPostPath(row.slug)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('viewOnSite', { title: row.title })}
              title={t('viewOnSiteShort')}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Icon name="open_in_new" className="text-[18px]" />
            </a>
          ) : (
            <span className="inline-block h-8 w-8" aria-hidden="true" />
          )}
          <IconButton
            icon="delete"
            size="sm"
            variant="danger"
            label={t('deleteRow', { title: row.title })}
            disabled={busy.has(row.id)}
            onClick={() => void remove(row)}
          />
        </span>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <>
            <Button href="/blog" external variant="ghost" icon="open_in_new">
              {t('viewBlog')}
            </Button>
            <Button href="/admin/blog/new" variant="primary" icon="add">
              {t('new')}
            </Button>
          </>
        }
      />

      <div className="shadow-ambient flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 md:p-5">
        <FilterTabs
          label={t('statusTabs')}
          controlsId="blog-results"
          value={status ?? ''}
          onChange={(value) => filters.set({ status: value })}
          tabs={[
            { value: '', label: t('tabs.all') },
            { value: 'published', label: t('tabs.published') },
            { value: 'draft', label: t('tabs.draft') },
          ]}
        />
        <FilterBar
          state={filters}
          fields={[
            { type: 'search', key: 'q', label: t('filters.search'), placeholder: t('filters.searchPlaceholder') },
            {
              type: 'select',
              key: 'category',
              label: t('filters.category'),
              allLabel: t('filters.allCategories'),
              options: (taxonomy.data?.categories ?? []).map((c) => ({ value: c.slug, label: c.label.en })),
            },
          ]}
        />

        {list.error && !list.data ? (
          <ErrorPanel error={list.error} onRetry={() => void list.refetch()} variant="inline" />
        ) : (
          <DataTable
            id="blog-results"
            caption={t('tableCaption')}
            columns={columns}
            rows={list.data?.items}
            loading={list.loading}
            fetching={list.fetching}
            getRowId={(row) => row.id}
            onRowClick={(row) => router.push(`/admin/blog/${row.id}`)}
            rowLabel={(row) => t('openRow', { title: row.title })}
            skeletonRows={6}
            empty={
              filters.isDefault() ? (
                <EmptyPanel
                  icon="article"
                  title={t('emptyTitle')}
                  body={t('emptyBody')}
                  action={
                    <Button href="/admin/blog/new" variant="primary" icon="add">
                      {t('new')}
                    </Button>
                  }
                />
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
