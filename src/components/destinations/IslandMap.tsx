'use client'

import { useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { contactHref } from '@/lib/prefill'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import {
  ADAMS_BRIDGE_PATH,
  HIGHLAND_PEAK_CONTOUR_PATH,
  HILL_CONTOUR_PATH,
  ISLAND_PATH,
  MAP_VIEWBOX,
  OFFSHORE_ISLAND_PATHS,
  REEF_PATH,
  WHALE_CORRIDOR_PATH,
  type LabelAnchor,
} from './islandMapGeometry'
import { regionTone } from './regionTones'
import { useRegionParam } from './useRegionParam'

export interface MapHub {
  slug: string
  name: string
  /** Short map label ("Sigiriya"). */
  label: string
  summary: string
  regionSlug: string | null
  regionName: string | null
  toneIndex: number
  /** The first destinations of the curated order pulse like the Stitch signature hubs. */
  signature: boolean
  x: number
  y: number
  labelX: number
  labelY: number
  anchor: LabelAnchor
}

export interface MapRegion {
  slug: string
  name: string
  description: string | null
  icon: string | null
  toneIndex: number
}

export interface IslandMapProps {
  hubs: MapHub[]
  regions: MapRegion[]
}

interface IslandMapViewProps extends IslandMapProps {
  selectedRegion: string | null
  onRegionChange: (slug: string | null) => void
}

/** Stylised island explorer (map canvas + region legend), with the region selection synced to `?region=`. */
export function IslandMap(props: IslandMapProps) {
  const [region, setRegion] = useRegionParam(props.regions.map((r) => r.slug))
  return <IslandMapView {...props} selectedRegion={region} onRegionChange={setRegion} />
}

const noop = () => undefined

/** Same map without URL state — the <Suspense> fallback rendered into the static HTML. */
export function IslandMapStatic(props: IslandMapProps) {
  return <IslandMapView {...props} selectedRegion={null} onRegionChange={noop} />
}

/** Keeps SVG scale/opacity animations centred on each circle. */
const CENTRED = { transformBox: 'fill-box', transformOrigin: 'center' } as const

function IslandMapView({ hubs, regions, selectedRegion, onRegionChange }: IslandMapViewProps) {
  const t = useTranslations('destinations.map')
  const tooltipId = useId()
  const landGradientId = useId()
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [previewRegion, setPreviewRegion] = useState<string | null>(null)
  const highlight = previewRegion ?? selectedRegion
  // Hovered/focused hub, else the first hub of the highlighted region, else the first (signature) hub.
  const active =
    hubs.find((h) => h.slug === activeSlug) ??
    (highlight ? hubs.find((h) => h.regionSlug === highlight) : undefined) ??
    hubs[0]

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-surface p-space-lg shadow-md md:p-space-xl">
      <div className="flex flex-col items-stretch gap-space-xl lg:flex-row">
        {/* Vector map canvas */}
        <div className="relative flex min-h-[480px] w-full flex-col justify-between overflow-hidden rounded-xl bg-surface-container-lowest p-space-md md:min-h-[540px] lg:w-7/12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(#0f4c5c 0.75px, transparent 0.75px)',
              backgroundSize: '20px 20px',
            }}
          />
          <div className="relative z-10 flex flex-1 items-center justify-center">
            <svg
              role="group"
              aria-label={t('label')}
              className="h-auto w-full max-w-[440px] drop-shadow-sm"
              fill="none"
              viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id={landGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F7F2E8" />
                  <stop offset="100%" stopColor="#ECE3D2" />
                </linearGradient>
              </defs>
              {/* Subtle coastal bathymetry halo */}
              <path d={ISLAND_PATH} stroke="#0F4C5C" strokeLinejoin="round" strokeOpacity={0.06} strokeWidth={12} />
              <path d={ISLAND_PATH} stroke="#0F4C5C" strokeLinejoin="round" strokeOpacity={0.11} strokeWidth={4.5} />
              {/* Adam's Bridge shoal chain */}
              <path
                d={ADAMS_BRIDGE_PATH}
                stroke="#0F4C5C"
                strokeDasharray="1.5 4"
                strokeLinecap="round"
                strokeOpacity={0.32}
                strokeWidth={1.5}
              />
              {/* Mainland + Jaffna Peninsula */}
              <path
                d={ISLAND_PATH}
                fill={`url(#${landGradientId})`}
                stroke="#0F4C5C"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.55}
              />
              {/* Mannar and Jaffna archipelago islands */}
              {OFFSHORE_ISLAND_PATHS.map((path, index) => (
                <path
                  key={index}
                  d={path}
                  fill={`url(#${landGradientId})`}
                  stroke="#0F4C5C"
                  strokeLinejoin="round"
                  strokeWidth={1.15}
                />
              ))}
              {/* Central Highlands topographic contours */}
              <path
                d={HILL_CONTOUR_PATH}
                fill="#E3DAC6"
                fillOpacity={0.62}
                stroke="#9C441E"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                strokeWidth={1}
              />
              <path
                d={HIGHLAND_PEAK_CONTOUR_PATH}
                fill="#D9CCB2"
                fillOpacity={0.52}
                stroke="#9C441E"
                strokeDasharray="2 2.5"
                strokeOpacity={0.72}
                strokeWidth={0.9}
              />
              {/* Offshore east reef and southern whale shelf */}
              <path
                d={REEF_PATH}
                stroke="#003441"
                strokeDasharray="2 4.5"
                strokeLinecap="round"
                strokeOpacity={0.42}
                strokeWidth={1.6}
              />
              <path
                d={WHALE_CORRIDOR_PATH}
                stroke="#0F4C5C"
                strokeDasharray="2 4.5"
                strokeLinecap="round"
                strokeOpacity={0.35}
                strokeWidth={1.5}
              />
              {/* Minimalist North compass rose */}
              <g aria-hidden="true" transform="translate(432, 56)" opacity={0.52} stroke="#0F4C5C" fill="#0F4C5C">
                <line x1={0} y1={-12} x2={0} y2={12} strokeWidth={0.9} />
                <line x1={-8} y1={0} x2={8} y2={0} strokeOpacity={0.6} strokeWidth={0.7} />
                <polygon points="0,-13 -2.8,-5 0,-7 2.8,-5" stroke="none" />
                <text
                  x={0}
                  y={-16}
                  textAnchor="middle"
                  fontSize={8.5}
                  fontWeight={600}
                  letterSpacing="0.08em"
                  stroke="none"
                >
                  N
                </text>
              </g>
              {hubs.map((hub) => {
                const tone = regionTone(hub.toneIndex)
                const isActive = hub.slug === active?.slug
                const dimmed = highlight !== null && hub.regionSlug !== highlight
                const lit = highlight !== null && hub.regionSlug === highlight
                return (
                  <Link
                    key={hub.slug}
                    href={`/destinations/${hub.slug}`}
                    aria-label={t('hubLink', { name: hub.name, region: hub.regionName ?? '' })}
                    aria-describedby={isActive ? tooltipId : undefined}
                    onMouseEnter={() => setActiveSlug(hub.slug)}
                    onFocus={() => setActiveSlug(hub.slug)}
                    className={cn(
                      'group cursor-pointer transition-opacity duration-300 focus:outline-none focus-visible:outline-none',
                      dimmed && 'opacity-25',
                    )}
                  >
                    {/* generous invisible hit area */}
                    <circle cx={hub.x} cy={hub.y} r={14} className="fill-transparent" />
                    {hub.signature && (
                      <circle
                        cx={hub.x}
                        cy={hub.y}
                        r={12}
                        fillOpacity={0.2}
                        className={cn(tone.fill, 'motion-safe:animate-pulse')}
                        style={CENTRED}
                      />
                    )}
                    {(lit || isActive) && (
                      <circle
                        cx={hub.x}
                        cy={hub.y}
                        r={10}
                        fill="none"
                        strokeWidth={1.5}
                        className={cn('transition-all', tone.stroke, isActive && !lit && 'opacity-60')}
                      />
                    )}
                    <circle
                      cx={hub.x}
                      cy={hub.y}
                      r={14}
                      fill="none"
                      strokeWidth={2}
                      className="stroke-primary opacity-0 group-focus-visible:opacity-100"
                    />
                    <circle
                      cx={hub.x}
                      cy={hub.y}
                      r={hub.signature || isActive ? 5.8 : 5}
                      stroke="#F7F2E8"
                      strokeWidth={1.6}
                      className={tone.fill}
                    />
                    <text
                      x={hub.labelX}
                      y={hub.labelY}
                      textAnchor={hub.anchor}
                      style={{
                        paintOrder: 'stroke',
                        stroke: '#FAF7F1',
                        strokeWidth: 3.5,
                        strokeLinejoin: 'round',
                      }}
                      className={cn(
                        'select-none font-label-md text-[11px] transition-colors',
                        hub.signature ? 'font-bold' : 'font-semibold',
                        tone.labelFill,
                        'group-hover:fill-secondary group-focus-visible:fill-secondary',
                      )}
                    >
                      {hub.label}
                    </text>
                  </Link>
                )
              })}
            </svg>
          </div>
          {hubs.length === 0 && (
            <p className="relative z-10 text-center font-caption text-caption text-on-surface-variant">{t('empty')}</p>
          )}
          {/* Active-hub card below the SVG so southern coastal hubs stay completely clear */}
          {active && (
            <div
              id={tooltipId}
              aria-live="polite"
              className="relative z-10 mt-space-sm min-h-[76px] rounded-lg border border-outline-variant/20 bg-surface/95 p-space-sm shadow-sm backdrop-blur-md transition-all duration-300"
            >
              <div className="flex items-center gap-space-xs">
                <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', regionTone(active.toneIndex).dot)} />
                <span className="font-label-lg text-label-lg uppercase text-primary">{active.name}</span>
              </div>
              <p className="mt-0.5 line-clamp-2 font-body-md text-body-md text-on-surface-variant">{active.summary}</p>
            </div>
          )}
        </div>

        {/* Region legend */}
        <div className="flex w-full flex-col justify-between gap-space-md lg:w-5/12">
          <div>
            <div className="flex items-center justify-between pb-space-sm">
              <h2 className="font-label-lg text-label-lg uppercase tracking-wider text-primary">
                {t('legendTitle', { count: regions.length })}
              </h2>
              <span className="font-caption text-caption text-on-surface-variant">{t('hoverHint')}</span>
            </div>
            <ul aria-label={t('legendLabel')} className="mt-space-sm flex flex-col gap-space-xs">
              {regions.map((region) => {
                const tone = regionTone(region.toneIndex)
                const selected = selectedRegion === region.slug
                return (
                  <li key={region.slug}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setActiveSlug(null)
                        onRegionChange(selected ? null : region.slug)
                      }}
                      onMouseEnter={() => {
                        setActiveSlug(null)
                        setPreviewRegion(region.slug)
                      }}
                      onMouseLeave={() => setPreviewRegion(null)}
                      onFocus={() => {
                        setActiveSlug(null)
                        setPreviewRegion(region.slug)
                      }}
                      onBlur={() => setPreviewRegion(null)}
                      className={cn(
                        'group flex w-full cursor-pointer items-start gap-space-sm rounded-xl p-space-sm text-left transition-all',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        selected
                          ? 'bg-surface-container ring-1 ring-secondary/30'
                          : 'bg-surface-container-low hover:bg-surface-container',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', tone.tile)}
                      >
                        <Icon name={region.icon || 'location_on'} className="text-base" />
                      </span>
                      <span className="flex flex-col">
                        <span
                          className={cn(
                            'font-headline-sm text-[16px] transition-colors group-hover:text-secondary',
                            selected ? 'text-secondary' : 'text-primary',
                          )}
                        >
                          {region.name}
                        </span>
                        {region.description && (
                          <span className="font-caption text-caption text-on-surface-variant">
                            {region.description}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="flex flex-col items-center gap-space-sm pt-space-sm sm:flex-row">
            <Link
              href={contactHref({ source: 'destinations-map' })}
              className="inline-flex w-full items-center justify-center gap-space-xs rounded-lg bg-primary px-space-lg py-space-sm font-label-lg text-label-lg text-on-primary shadow-sm transition-all hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 coarse:min-h-11 sm:w-auto"
            >
              <span>{t('routingCta')}</span>
              <Icon name="arrow_forward" className="text-sm" />
            </Link>
            <span className="text-center font-caption text-caption text-on-surface-variant sm:text-left">
              {t('routingNote')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
