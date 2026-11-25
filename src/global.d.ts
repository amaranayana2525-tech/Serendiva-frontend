import type { Locale } from '@/i18n/routing'
import type about from '@/messages/en/about.json'
import type admin from '@/messages/en/admin.json'
import type adminContent from '@/messages/en/adminContent.json'
import type adminLibrary from '@/messages/en/adminLibrary.json'
import type adminTours from '@/messages/en/adminTours.json'
import type blog from '@/messages/en/blog.json'
import type common from '@/messages/en/common.json'
import type contact from '@/messages/en/contact.json'
import type corporate from '@/messages/en/corporate.json'
import type destinationDetail from '@/messages/en/destinationDetail.json'
import type destinations from '@/messages/en/destinations.json'
import type gallery from '@/messages/en/gallery.json'
import type home from '@/messages/en/home.json'
import type legal from '@/messages/en/legal.json'
import type newsletter from '@/messages/en/newsletter.json'
import type quiz from '@/messages/en/quiz.json'
import type responsible from '@/messages/en/responsible.json'
import type reviews from '@/messages/en/reviews.json'
import type tourDetail from '@/messages/en/tourDetail.json'
import type tours from '@/messages/en/tours.json'
import type travelGuide from '@/messages/en/travelGuide.json'

/** English message files are the source of truth for message keys (typed `t()` calls). */
export type AppMessages = {
  common: typeof common
  home: typeof home
  tours: typeof tours
  tourDetail: typeof tourDetail
  destinations: typeof destinations
  destinationDetail: typeof destinationDetail
  corporate: typeof corporate
  about: typeof about
  gallery: typeof gallery
  reviews: typeof reviews
  contact: typeof contact
  travelGuide: typeof travelGuide
  blog: typeof blog
  responsible: typeof responsible
  quiz: typeof quiz
  legal: typeof legal
  newsletter: typeof newsletter
  admin: typeof admin
  adminTours: typeof adminTours
  adminContent: typeof adminContent
  adminLibrary: typeof adminLibrary
}

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale
    Messages: AppMessages
  }
}
