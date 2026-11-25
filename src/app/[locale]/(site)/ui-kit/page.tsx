import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { BlogCard } from '@/components/cards/BlogCard'
import { CategoryTile } from '@/components/cards/CategoryTile'
import { DestinationCard } from '@/components/cards/DestinationCard'
import { FeaturedTourCard } from '@/components/cards/FeaturedTourCard'
import { ReviewCard } from '@/components/cards/ReviewCard'
import { TourCard } from '@/components/cards/TourCard'
import { AvailabilityCalendar } from '@/components/sections/AvailabilityCalendar'
import { BestTimeMatrix, SeasonLegend } from '@/components/sections/BestTimeMatrix'
import { FaqSection } from '@/components/sections/FaqSection'
import { FinalCta } from '@/components/sections/FinalCta'
import { InquirySidebarCard } from '@/components/sections/InquirySidebarCard'
import { Badge } from '@/components/ui/Badge'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Chip, Pill } from '@/components/ui/Chip'
import { Container } from '@/components/ui/Container'
import { CountUp } from '@/components/ui/CountUp'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Icon } from '@/components/ui/Icon'
import { Markdown } from '@/components/ui/Markdown'
import { Pagination } from '@/components/ui/Pagination'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { CardSkeleton, ReviewSkeleton, Skeleton, TileSkeleton } from '@/components/ui/Skeleton'
import { SmartImage } from '@/components/ui/SmartImage'
import { Stars } from '@/components/ui/Stars'
import type { Locale } from '@/i18n/routing'
import { buildMetadata } from '@/lib/seo'
import {
  sampleAvailability,
  sampleCategory,
  sampleDestinations,
  sampleFaqs,
  samplePost,
  sampleRegions,
  sampleReviews,
  sampleTours,
} from './fixtures'
import { KitInteractive } from './KitInteractive'

// DEV-ONLY component showcase. Returns 404 in production builds and is never indexed.
// Demo copy below is intentionally hard-coded (not user-facing).

export async function generateMetadata({ params }: PageProps<'/[locale]/ui-kit'>): Promise<Metadata> {
  const { locale } = await params
  return buildMetadata({ locale: locale as Locale, path: '/ui-kit', title: 'UI kit', noindex: true })
}

function Block({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className="flex flex-col gap-space-md border-t border-surface-container-high pt-space-xl">
      <h2 className="font-label-lg text-label-lg uppercase tracking-widest text-secondary">{title}</h2>
      <div className={className}>{children}</div>
    </section>
  )
}

const MARKDOWN = `## Getting around

Private chauffeur-guided travel is the calmest way to see the island. **Trains** are scenic but slow.

### Tuk-tuks
- Agree the fare first
- Use [my travel guide](/travel-guide) for etiquette

> “There is always a sunny coast in Sri Lanka.”
`

export default async function UiKitPage({ params }: PageProps<'/[locale]/ui-kit'>) {
  if (process.env.NODE_ENV === 'production') notFound()
  const { locale } = await params
  setRequestLocale(locale as Locale)

  return (
    <Container className="flex flex-col gap-space-xl py-space-2xl">
      <div className="flex flex-col gap-space-xs">
        <Eyebrow size="lg">Developer reference</Eyebrow>
        <h1 className="font-headline-xl text-headline-xl text-primary">Serendiva UI kit</h1>
        <p className="max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
          Every shared component with its Stitch styling. Source: <code>src/components/ui</code>, <code>cards</code>,{' '}
          <code>sections</code>, <code>layout</code>.
        </p>
      </div>

      <Block title="Buttons" className="flex flex-col gap-space-md">
        <div className="flex flex-wrap items-center gap-space-sm">
          <Button>Primary</Button>
          <Button variant="accent">Plan My Trip</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="whatsapp" leadingIcon="chat">
            WhatsApp
          </Button>
          <Button variant="soft" uppercase size="sm">
            View Itinerary
          </Button>
          <Button variant="light">Light</Button>
          <Button variant="link" trailingIcon="east" href="/tours">
            Explore all blueprints
          </Button>
          <Button loading>Sending</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-space-sm rounded-2xl bg-primary p-space-lg">
          <Button variant="accent" size="lg" shape="pill">
            Explore Curated Tours
          </Button>
          <Button variant="ghostLight" size="lg" shape="pill" leadingIcon="chat" href="https://wa.me/94771234567">
            Chat on WhatsApp
          </Button>
          <Button variant="whatsapp" size="lg" uppercase leadingIcon="chat">
            Chat Directly on WhatsApp
          </Button>
        </div>
      </Block>

      <Block title="Typography & headings" className="flex flex-col gap-space-xl">
        <SectionHeading
          eyebrow="Diverse Ceylon Archetypes"
          title="Choose Your Island Horizon"
          intro="Every category can be blended seamlessly into one multi-week voyage."
        />
        <SectionHeading
          align="center"
          size="lg"
          eyebrow="Clarifications & Assurances"
          title="Frequently Asked Questions"
          intro="Everything you need to know."
        />
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Curated Tours', href: '/tours' },
            { label: 'The Cultural Odyssey' },
          ]}
          jsonLd={false}
        />
        <Markdown>{MARKDOWN}</Markdown>
      </Block>

      <Block title="Chips, pills, badges, stars, icons" className="flex flex-col gap-space-md">
        <div className="flex flex-wrap gap-space-xs">
          <Chip active>All Tours</Chip>
          <Chip>Cultural & Heritage</Chip>
          <Chip count={4}>Wildlife & Safari</Chip>
          <Chip href="/tours" icon="travel_explore">
            Link chip
          </Chip>
        </div>
        <div className="flex flex-wrap gap-space-xs">
          <Pill>Leopard Safari in Yala</Pill>
          <Pill tone="muted">Muted</Pill>
          <Pill tone="green" icon="eco">
            Curated
          </Pill>
          <Pill tone="season">Dec to April</Pill>
          <Pill tone="cinnamon">Cinnamon</Pill>
        </div>
        <div className="flex flex-wrap items-center gap-space-xs rounded-xl bg-primary-container p-space-md">
          <Badge>Cultural & Heritage</Badge>
          <Badge className="text-tertiary">Wildlife</Badge>
          <Badge variant="accent">★ Most Popular</Badge>
          <Badge variant="dark">8 Nights / 9 Days</Badge>
          <Badge variant="green" icon="eco">
            Eco
          </Badge>
          <Badge variant="gold" icon="verified_user" iconFilled>
            SLTDA Licensed
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-space-lg">
          <Stars rating={5} filled={false} />
          <Stars rating={4.5} starClassName="text-[18px]" count={118} />
          <Stars rating={3} />
          <span className="flex items-center gap-space-sm text-primary">
            <Icon name="verified_user" filled className="text-tertiary" />
            <Icon name="temple_buddhist" className="text-2xl" />
            <Icon name="expand_more" className="text-secondary" />
            <Icon name="star" filled className="text-[18px] text-secondary" />
            <Icon name="chat" label="WhatsApp" />
          </span>
          <span className="font-headline-xl text-headline-xl font-bold text-primary">
            <CountUp value="2,400+" />
          </span>
        </div>
      </Block>

      <Block title="Interactive (client components)">
        <KitInteractive />
      </Block>

      <Block title="Accordion / FaqSection" className="grid gap-gutter-lg lg:grid-cols-12">
        <FaqSection className="lg:col-span-7" items={sampleFaqs} jsonLd={false} />
        <div className="flex flex-col gap-space-md lg:col-span-5">
          <SeasonLegend />
          <AvailabilityCalendar calendar={sampleAvailability} />
        </div>
      </Block>

      <Block title="BestTimeMatrix">
        <BestTimeMatrix regions={sampleRegions} caption="Best time to visit by region" />
      </Block>

      <Block title="TourCard (default + compact) & FeaturedTourCard" className="flex flex-col gap-gutter-lg">
        <div className="grid grid-cols-1 gap-gutter-lg md:grid-cols-2 lg:grid-cols-3">
          {sampleTours.map((tour, i) => (
            <Reveal key={tour.id} delay={i * 0.08}>
              <TourCard tour={tour} index={i} />
            </Reveal>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-3">
          {sampleTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} variant="compact" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-gutter-lg md:grid-cols-2">
          <FeaturedTourCard tour={sampleTours[0]!} />
          <FeaturedTourCard tour={sampleTours[1]!} />
        </div>
      </Block>

      <Block title="CategoryTile, DestinationCard (mosaic + explorer)" className="flex flex-col gap-gutter-lg">
        <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3">
          <CategoryTile category={sampleCategory} />
          <DestinationCard variant="mosaic" destination={sampleDestinations[0]!} />
          <DestinationCard
            variant="mosaic"
            destination={sampleDestinations[1]!}
            className="aspect-[4/3] md:aspect-[3/4]"
          />
        </div>
        <div className="grid grid-cols-1 gap-gutter-lg md:grid-cols-2 lg:grid-cols-12">
          <DestinationCard destination={sampleDestinations[0]!} featured className="lg:col-span-7" />
          <DestinationCard destination={sampleDestinations[1]!} index={1} className="lg:col-span-5" />
        </div>
      </Block>

      <Block title="ReviewCard (compact / list / full)" className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <ReviewCard review={sampleReviews[0]!} />
        <ReviewCard review={sampleReviews[1]!} variant="list" index={1} />
        <ReviewCard review={sampleReviews[1]!} variant="full" />
      </Block>

      <Block title="BlogCard (home / list)" className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <BlogCard post={samplePost} />
        <BlogCard post={samplePost} variant="list" />
        <div className="relative h-60 overflow-hidden rounded-xl">
          <SmartImage image={null} alt="Sigiriya rock at sunrise" fill />
        </div>
      </Block>

      <Block title="InquirySidebarCard shell" className="grid gap-gutter-lg lg:grid-cols-12">
        <div className="lg:col-span-4">
          <InquirySidebarCard id="kit-inquiry">
            <p className="font-body-md text-body-md text-on-surface-variant">
              The tour inquiry form goes here (children).
            </p>
            <Button variant="accent" uppercase fullWidth leadingIcon="send">
              Send Custom Inquiry
            </Button>
          </InquirySidebarCard>
        </div>
        <div className="flex flex-col gap-space-md lg:col-span-8">
          <EmptyState action={<Button variant="soft">Reset filters</Button>} />
          <ErrorState retryHref="/ui-kit" />
        </div>
      </Block>

      <Block title="Skeletons & Pagination (link mode)" className="flex flex-col gap-space-lg">
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-4">
          <CardSkeleton />
          <TileSkeleton />
          <ReviewSkeleton />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32" />
          </div>
        </div>
        <Pagination page={2} totalPages={5} hrefFor={(p) => ({ pathname: '/ui-kit', query: { page: String(p) } })} />
      </Block>

      <Block title="FinalCta">
        <FinalCta contact={{ whatsappDisplay: '+94 77 123 4567', phone: '', responseTime: '1 hour' }} />
      </Block>
    </Container>
  )
}
