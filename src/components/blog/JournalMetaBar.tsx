import type { ReactNode } from 'react'
import { Container } from '@/components/ui/Container'
import { PageBreadcrumbs, type PageBreadcrumbItem } from './PageBreadcrumbs'

/** Thin sand bar under the header: breadcrumb left, journal meta right (Stitch "Archive Meta Bar"). */
export function JournalMetaBar({ items, meta }: { items: PageBreadcrumbItem[]; meta?: ReactNode }) {
  return (
    <div className="w-full bg-surface-container-low/70 py-space-sm">
      <Container className="flex flex-wrap items-center justify-between gap-space-xs">
        <PageBreadcrumbs items={items} homeIcon className="tracking-[0.14em]" />
        {meta && (
          <div className="flex flex-wrap items-center gap-space-sm font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
            {meta}
          </div>
        )}
      </Container>
    </div>
  )
}
