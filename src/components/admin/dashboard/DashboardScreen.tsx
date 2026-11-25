'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { Card } from '@/components/admin/kit/Card'
import { BarChart, BarList, StatCard } from '@/components/admin/kit/charts'
import { PageHeader } from '@/components/admin/kit/PageHeader'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '@/components/admin/kit/Panels'
import { StatusBadge } from '@/components/admin/kit/StatusBadge'
import { Icon } from '@/components/ui/Icon'
import { firstName, parseMonth } from '@/lib/admin/format'
import { useDrawerParam } from '@/lib/admin/url-state'
import type { AdminStats } from '@/lib/api/types'
import { InquiryDrawer } from '../leads/InquiryDrawer'
import { useLeadFormat } from '../leads/useLeadFormat'
import { useAdminSession } from '../shell/AdminSession'

/** /admin — KPIs, inquiries by month/country/tour/source and the latest 5 inquiries (click → drawer). */
export function DashboardScreen() {
  const t = useTranslations('admin.dashboard')
  const { user, statsQuery } = useAdminSession()
  const drawer = useDrawerParam('id')
  const stats = statsQuery.data

  return (
    <>
      <PageHeader
        title={t('title')}
        description={user ? t('greeting', { name: firstName(user.name) }) : t('description')}
        actions={
          <Button href="/admin/inquiries" variant="primary" icon="inbox">
            {t('openInquiries')}
          </Button>
        }
      />
      {statsQuery.error && !stats ? (
        <ErrorPanel error={statsQuery.error} onRetry={() => void statsQuery.refetch()} />
      ) : !stats ? (
        <div className="flex flex-col gap-4">
          <LoadingPanel variant="stats" rows={8} card={false} />
          <LoadingPanel variant="detail" rows={4} />
        </div>
      ) : (
        <DashboardContent stats={stats} onOpenInquiry={drawer.open} />
      )}
      <InquiryDrawer id={drawer.id} onClose={drawer.close} />
    </>
  )
}

function DashboardContent({ stats, onOpenInquiry }: { stats: AdminStats; onOpenInquiry: (id: string) => void }) {
  const t = useTranslations('admin.dashboard')
  const format = useFormatter()
  const f = useLeadFormat()
  const { inquiries, proposals, reviews, newsletter } = stats
  const n = (v: number) => format.number(v)

  const months = inquiries.byMonth.map((m) => {
    const date = parseMonth(m.month)
    return {
      label: date ? format.dateTime(date, { month: 'short', timeZone: 'UTC' }) : m.month,
      fullLabel: date ? format.dateTime(date, { month: 'long', year: 'numeric', timeZone: 'UTC' }) : m.month,
      value: m.count,
    }
  })
  const countries = inquiries.byCountry.map((c) => ({
    label: c.country === 'Unknown' ? t('unknown') : c.country,
    value: c.count,
    href: c.country === 'Unknown' ? undefined : `/admin/inquiries?country=${encodeURIComponent(c.country)}`,
  }))
  const tours = inquiries.byTour.map((tour) => ({
    label: tour.title,
    value: tour.count,
    href: `/admin/inquiries?tour=${encodeURIComponent(tour.tourId)}`,
  }))
  const sources = inquiries.bySource.map((s) => ({
    label: s.source === '/' ? t('sourceHome') : s.source === 'Unknown' ? t('unknown') : s.source,
    value: s.count,
  }))

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <section aria-label={t('kpis')} className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard
          label={t('stats.newInquiries')}
          value={n(inquiries.new)}
          icon="mark_email_unread"
          tone={inquiries.new > 0 ? 'attention' : 'default'}
          hint={t('stats.newInquiriesHint', { total: inquiries.total })}
          href="/admin/inquiries?status=new"
        />
        <StatCard label={t('stats.thisWeek')} value={n(inquiries.thisWeek)} icon="date_range" hint={t('stats.thisWeekHint')} />
        <StatCard label={t('stats.thisMonth')} value={n(inquiries.thisMonth)} icon="calendar_month" hint={t('stats.thisMonthHint')} />
        <StatCard
          label={t('stats.conversion')}
          value={format.number(inquiries.conversionRate, { style: 'percent', maximumFractionDigits: 0 })}
          icon="trending_up"
          tone="positive"
          hint={t('stats.conversionHint')}
        />
        <StatCard
          label={t('stats.newProposals')}
          value={n(proposals.new)}
          icon="business_center"
          tone={proposals.new > 0 ? 'attention' : 'default'}
          hint={t('stats.newProposalsHint', { total: proposals.total })}
          href="/admin/proposals?status=new"
        />
        <StatCard
          label={t('stats.pendingReviews')}
          value={n(reviews.pending)}
          icon="rate_review"
          tone={reviews.pending > 0 ? 'attention' : 'default'}
          hint={t('stats.pendingReviewsHint')}
          href="/admin/reviews"
        />
        <StatCard
          label={t('stats.newsletter')}
          value={n(newsletter.confirmed)}
          icon="mark_email_read"
          hint={t('stats.newsletterHint', { pending: newsletter.pending })}
          href="/admin/newsletter"
        />
        <StatCard
          label={t('stats.total')}
          value={n(inquiries.total)}
          icon="inbox"
          hint={t('stats.totalHint', {
            confirmed: inquiries.byStatus.confirmed,
            replied: inquiries.byStatus.replied + inquiries.byStatus.proposal_sent,
          })}
        />
      </section>

      <div className="grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-5">
        <Card title={t('byMonth')} description={t('byMonthHint')} icon="bar_chart" className="xl:col-span-3">
          <BarChart
            data={months}
            title={t('byMonth')}
            valueLabel={t('inquiries')}
            categoryLabel={t('month')}
            highlightIndex={months.length - 1}
            height={220}
          />
        </Card>
        <Card
          title={t('latest')}
          icon="schedule"
          className="xl:col-span-2"
          flush
          actions={
            <Button href="/admin/inquiries" variant="link" size="sm" iconEnd="arrow_forward">
              {t('viewAll')}
            </Button>
          }
        >
          {inquiries.latest.length === 0 ? (
            <EmptyPanel icon="inbox" title={t('noInquiriesTitle')} body={t('noInquiriesBody')} />
          ) : (
            <ul className="divide-y divide-surface-container">
              {inquiries.latest.map((lead) => (
                <li key={lead.id}>
                  <button
                    type="button"
                    onClick={() => onOpenInquiry(lead.id)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container-low focus-visible:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary md:px-5"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary">
                      <Icon name="person" className="text-[18px]" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-body-md text-body-md font-semibold text-primary">{lead.name}</span>
                        <StatusBadge kind="lead" status={lead.status} />
                      </span>
                      <span className="truncate font-caption text-caption text-on-surface-variant">
                        {lead.tour?.title ?? lead.destination?.name ?? t('noTour')}
                      </span>
                      <span className="font-caption text-caption text-on-surface-variant">
                        <span className="font-mono">{lead.reference}</span> · {f.relative(lead.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
        <Card title={t('byCountry')} icon="public">
          <BarList data={countries} title={t('byCountry')} limit={8} showShare empty={t('noData')} />
        </Card>
        <Card title={t('byTour')} icon="map">
          <BarList data={tours} title={t('byTour')} limit={8} empty={t('noData')} />
        </Card>
        <Card title={t('bySource')} icon="ads_click" className="md:col-span-2 xl:col-span-1">
          <BarList data={sources} title={t('bySource')} limit={8} showShare empty={t('noData')} />
        </Card>
      </div>
    </div>
  )
}
