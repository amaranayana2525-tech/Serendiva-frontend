/**
 * Friendly aliases for the generated OpenAPI types (src/lib/api/schema.d.ts — run `npm run api:types` to refresh).
 * Import DTO types from here, never from schema.d.ts directly.
 */
import type { components, paths } from './schema'

type Schemas = components['schemas']

// ---------------------------------------------------------------- public DTOs
export type ErrorResponse = Schemas['ErrorResponse']
export type Ok = Schemas['Ok']
export type Image = Schemas['Image']
export type PageMeta = Schemas['PageMeta']
export type TravellerType = Schemas['TravellerType']
export type ReviewSource = Schemas['ReviewSource']
export type CategoryRef = Schemas['CategoryRef']
export type FaqItem = Schemas['FaqItem']
export type ReviewCard = Schemas['ReviewCard']
export type ReviewSummary = Schemas['ReviewSummary']
export type Seo = Schemas['Seo']
export type TourCard = Schemas['TourCard']
export type TourList = Schemas['TourList']
export type TourDay = Schemas['TourDay']
export type TourDetail = Schemas['TourDetail']
export type Category = Schemas['Category']
export type CategoryList = Schemas['CategoryList']
export type MonthRating = Schemas['MonthRating']
export type Region = Schemas['Region']
export type RegionList = Schemas['RegionList']
export type RegionRef = Schemas['RegionRef']
export type DestinationCard = Schemas['DestinationCard']
export type DestinationList = Schemas['DestinationList']
export type DestinationDetail = Schemas['DestinationDetail']
export type ReviewStatus = Schemas['ReviewStatus']
export type ReviewList = Schemas['ReviewList']
export type ReviewSubmissionBody = Schemas['ReviewSubmissionBody']
export type ReviewSubmissionResult = Schemas['ReviewSubmissionResult']
export type FaqScope = Schemas['FaqScope']
export type FaqList = Schemas['FaqList']
export type BlogCategoryRef = Schemas['BlogCategoryRef']
export type BlogCard = Schemas['BlogCard']
export type BlogList = Schemas['BlogList']
export type BlogHeading = Schemas['BlogHeading']
export type BlogPostDetail = Schemas['BlogPostDetail']
export type GalleryType = Schemas['GalleryType']
export type GalleryItem = Schemas['GalleryItem']
export type GalleryList = Schemas['GalleryList']
export type AvailabilityType = Schemas['AvailabilityType']
export type AvailabilityRange = Schemas['AvailabilityRange']
export type AvailabilityCalendar = Schemas['AvailabilityCalendar']
export type PublicSettings = Schemas['PublicSettings']
export type SitemapData = Schemas['SitemapData']

// ---------------------------------------------------------------- admin DTOs
export type ReorderBody = Schemas['ReorderBody']
export type StatusBody = Schemas['StatusBody']
export type LoginBody = Schemas['LoginBody']
export type AdminUser = Schemas['AdminUser']
export type AdminSession = Schemas['AdminSession']
export type ChangePasswordBody = Schemas['ChangePasswordBody']
export type AdminMediaRef = Schemas['AdminMediaRef']
export type TourDayWrite = Schemas['TourDayWrite']
export type TourWrite = Schemas['TourWrite']
export type AdminTourListItem = Schemas['AdminTourListItem']
export type AdminTourList = Schemas['AdminTourList']
export type AdminTour = Schemas['AdminTour']
export type CategoryWrite = Schemas['CategoryWrite']
export type AdminCategory = Schemas['AdminCategory']
export type AdminCategoryList = Schemas['AdminCategoryList']
export type RegionWrite = Schemas['RegionWrite']
export type AdminRegion = Schemas['AdminRegion']
export type AdminRegionList = Schemas['AdminRegionList']
export type DestinationWrite = Schemas['DestinationWrite']
export type AdminDestinationListItem = Schemas['AdminDestinationListItem']
export type AdminDestinationList = Schemas['AdminDestinationList']
export type AdminDestination = Schemas['AdminDestination']
export type ReviewWrite = Schemas['ReviewWrite']
export type ReviewStatusBody = Schemas['ReviewStatusBody']
export type ReviewFeatureBody = Schemas['ReviewFeatureBody']
export type AdminReview = Schemas['AdminReview']
export type AdminReviewList = Schemas['AdminReviewList']
export type FaqWrite = Schemas['FaqWrite']
export type AdminFaq = Schemas['AdminFaq']
export type AdminFaqList = Schemas['AdminFaqList']
export type BlogPostWrite = Schemas['BlogPostWrite']
export type AdminBlogListItem = Schemas['AdminBlogListItem']
export type AdminBlogList = Schemas['AdminBlogList']
export type AdminBlogPost = Schemas['AdminBlogPost']
export type GalleryItemWrite = Schemas['GalleryItemWrite']
export type GalleryBulkBody = Schemas['GalleryBulkBody']
export type AdminGalleryItem = Schemas['AdminGalleryItem']
export type AdminGalleryList = Schemas['AdminGalleryList']
export type AvailabilityWrite = Schemas['AvailabilityWrite']
export type AdminAvailabilityRange = Schemas['AdminAvailabilityRange']
export type AdminAvailabilityList = Schemas['AdminAvailabilityList']
export type AdminSettings = Schemas['AdminSettings']
export type SettingContactBody = Schemas['SettingContactBody']
export type SettingSocialBody = Schemas['SettingSocialBody']
export type SettingGuideBody = Schemas['SettingGuideBody']
export type SettingCountersBody = Schemas['SettingCountersBody']
export type SettingTrustBadgesBody = Schemas['SettingTrustBadgesBody']
export type SettingHeroSlidesBody = Schemas['SettingHeroSlidesBody']
export type SettingSeoBody = Schemas['SettingSeoBody']
export type SettingCorporateClientsBody = Schemas['SettingCorporateClientsBody']
export type SettingInstagramFeedBody = Schemas['SettingInstagramFeedBody']
// admin leads / media / stats (added by the admin panel author)
export type LeadStatus = Schemas['LeadStatus']
export type LeadEmailStatus = Schemas['LeadEmailStatus']
export type LeadCounts = Schemas['LeadCounts']
export type LeadEventType = Schemas['LeadEventType']
export type LeadEvent = Schemas['LeadEvent']
export type LeadContactBody = Schemas['LeadContactBody']
export type AdminLeadTourRef = Schemas['AdminLeadTourRef']
export type AdminLeadDestinationRef = Schemas['AdminLeadDestinationRef']
export type AdminInquiry = Schemas['AdminInquiry']
export type AdminInquiryListItem = Schemas['AdminInquiryListItem']
export type AdminInquiryList = Schemas['AdminInquiryList']
export type AdminInquiryCreateBody = Schemas['AdminInquiryCreateBody']
export type InquiryUpdateBody = Schemas['InquiryUpdateBody']
export type AdminProposal = Schemas['AdminProposal']
export type AdminProposalListItem = Schemas['AdminProposalListItem']
export type AdminProposalList = Schemas['AdminProposalList']
export type AdminProposalAttachment = Schemas['AdminProposalAttachment']
export type ProposalUpdateBody = Schemas['ProposalUpdateBody']
export type AdminStats = Schemas['AdminStats']
export type AdminMedia = Schemas['AdminMedia']
export type AdminMediaDetail = Schemas['AdminMediaDetail']
export type AdminMediaList = Schemas['AdminMediaList']
export type MediaUploadResult = Schemas['MediaUploadResult']
export type MediaUploadError = Schemas['MediaUploadError']
export type MediaUsage = Schemas['MediaUsage']
export type MediaUsageType = Schemas['MediaUsageType']
export type MediaUpdateBody = Schemas['MediaUpdateBody']
export type SubscriberStatus = Schemas['SubscriberStatus']
export type AdminSubscriber = Schemas['AdminSubscriber']
export type AdminSubscriberList = Schemas['AdminSubscriberList']

// ---------------------------------------------------------------- convenience aliases
/** An image as delivered by the API (alias that avoids clashing with next/image's `Image`). */
export type ApiImage = Image
export type Locale = 'en' | 'zh' | 'de'
export type ContactSettings = PublicSettings['contact']
export type GuideSettings = PublicSettings['guide']
export type TrustBadge = PublicSettings['trustBadges'][number]
export type Counter = PublicSettings['counters'][number]
export type TourGalleryItem = TourDetail['gallery'][number]
export type TourKeyFeature = TourDetail['keyFeatures'][number]
export type DestinationQuickFact = DestinationDetail['quickFacts'][number]
export type DestinationExperience = DestinationDetail['experiences'][number]
export type MapPoint = DestinationDetail['mapPoints'][number]
export type TourStop = TourDay['stops'][number]
/** Blog category chip with its post count (GET /blog → `categories`). */
export type BlogCategoryCount = BlogList['categories'][number]

type QueryOf<P extends keyof paths> = paths[P] extends { get: { parameters: { query?: infer Q } } }
  ? NonNullable<Q>
  : never

/** Query parameters accepted by the public list endpoints (locale is added by lib/api/public.ts). */
export type TourQuery = Omit<QueryOf<'/api/v1/tours'>, 'locale'>
export type DestinationQuery = Omit<QueryOf<'/api/v1/destinations'>, 'locale'>
export type ReviewQuery = Omit<QueryOf<'/api/v1/reviews'>, 'locale'>
export type FaqQuery = Omit<QueryOf<'/api/v1/faqs'>, 'locale'>
export type BlogQuery = Omit<QueryOf<'/api/v1/blog'>, 'locale'>
export type GalleryQuery = Omit<QueryOf<'/api/v1/gallery'>, 'locale'>
export type AvailabilityQuery = QueryOf<'/api/v1/availability'>

// ---------------------------------------------------------------- form contracts
// The inquiry / proposal / newsletter endpoints are being added to the API right now. These types mirror the
// contracts in FRONTEND_SPEC.md; once `npm run api:types` picks the endpoints up, replace them with Schemas[...] aliases.

export type PartyType = 'couple' | 'family' | 'group' | 'solo' | 'corporate'

/** POST /api/v1/inquiries (JSON). */
export interface InquiryBody {
  name: string
  email: string
  whatsapp?: string
  country?: string
  partyType?: PartyType
  adults: number
  children: number
  /** YYYY-MM-DD */
  travelStart?: string
  /** YYYY-MM-DD */
  travelEnd?: string
  travelWindow?: string
  flexibleDates?: boolean
  flexibility?: string
  durationPreference?: string
  pace?: string
  stayStyle?: string
  interests: string[]
  tourSlug?: string
  destinationSlug?: string
  message?: string
  sourcePage?: string
  locale: Locale
  /** Honeypot — must stay empty. */
  website?: string
  turnstileToken?: string
  /** Same random id for every retry of one submission — the API returns the saved inquiry instead of a duplicate. */
  clientRequestId?: string
}

/** 201 response of POST /inquiries. */
export interface InquiryResult {
  /** e.g. "SRD-2026-0001" */
  reference: string
  message: string
}

/** Fields of POST /api/v1/corporate-proposals (sent as multipart/form-data). */
export interface ProposalBody {
  company: string
  contactPerson: string
  email: string
  phone: string
  groupSize: string
  dates: string
  eventType: string
  logistics: string[]
  message?: string
  sourcePage?: string
  locale: Locale
  website?: string
  turnstileToken?: string
  /** Same random id for every retry of one submission — the API returns the saved proposal instead of a duplicate. */
  clientRequestId?: string
  /** PDF or DOCX, ≤ 5 MB */
  attachment?: File | null
}

/** 201 response of POST /corporate-proposals. */
export interface ProposalResult {
  /** e.g. "SRD-C-2026-0001" */
  reference: string
  message: string
}

/** POST /api/v1/newsletter/subscribe (JSON). */
export interface NewsletterSubscribeBody {
  email: string
  locale: Locale
  source?: string
  website?: string
  turnstileToken?: string
}

export interface NewsletterSubscribeResult {
  status: 'pending' | 'already_subscribed'
  message: string
}

/** GET /newsletter/confirm and /newsletter/unsubscribe. */
export interface NewsletterTokenResult {
  status: 'confirmed' | 'already_confirmed' | 'unsubscribed'
}
