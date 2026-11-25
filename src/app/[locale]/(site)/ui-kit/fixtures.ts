// Dev-only sample DTOs for /ui-kit (shaped exactly like the API responses; images null → SmartImage placeholders).
import type {
  AvailabilityCalendar,
  BlogCard,
  Category,
  DestinationCard,
  FaqItem,
  Region,
  ReviewCard,
  TourCard,
} from '@/lib/api/types'

const cat = (slug: string, name: string, shortName: string) => ({ id: slug, slug, name, shortName })

export const sampleTours: TourCard[] = [
  {
    id: 't1',
    slug: 'cultural-odyssey',
    title: 'The Cultural Odyssey',
    summary:
      'Sigiriya at dawn, sacred Kandy and the tea hills — a private journey through the island’s ancient kingdoms.',
    cardTag: 'Chauffeur Guide',
    durationDays: 9,
    durationNights: 8,
    route: ['Colombo', 'Sigiriya', 'Polonnaruwa', 'Kandy', 'Galle'],
    highlights: ['Sigiriya Private Dawn Climb', 'Sacred Tooth Relic VIP Entry', 'Bespoke Village Cooking Feast'],
    isFeatured: true,
    isMostPopular: true,
    cover: null,
    categories: [cat('cultural-heritage', 'Cultural & Ancient Kingdoms', 'Cultural & Heritage')],
    travellerTypes: ['couple', 'family'],
    seasons: ['dec-apr'],
  },
  {
    id: 't2',
    slug: 'wild-leopards',
    title: 'Wild Leopards & Untamed Coastlines',
    summary: 'Private trackers, open-sided 4x4 safaris and blue-whale mornings off Mirissa.',
    cardTag: 'Private 4x4 Jeep',
    durationDays: 8,
    durationNights: 7,
    route: ['Colombo', 'Wilpattu', 'Udawalawe', 'Yala', 'Mirissa'],
    highlights: ['Private 4x4 Naturalist', 'Blue Whale Yacht Charter', 'Luxury Tented Eco-Camp'],
    isFeatured: true,
    isMostPopular: false,
    cover: null,
    categories: [cat('wildlife-safari', 'Wildlife & Safari Expeditions', 'Wildlife & Safari')],
    travellerTypes: ['family', 'group'],
    seasons: [],
  },
  {
    id: 't3',
    slug: 'tea-mist-monasteries',
    title: 'Tea Mist, Monasteries & Colonial Charms',
    summary: 'Quiet hill-country retreats, forest hermitages and single-estate tea cuppings.',
    cardTag: 'Scenic Rail Included',
    durationDays: 7,
    durationNights: 6,
    route: ['Kandy', 'Nuwara Eliya', 'Ella', 'Hatton'],
    highlights: ['Observation Car Rail Journey', 'Planter’s Bungalow Stay'],
    isFeatured: false,
    isMostPopular: false,
    cover: null,
    categories: [cat('hill-country', 'Central Hill Country & Tea Trails', 'Hill Country')],
    travellerTypes: ['couple'],
    seasons: [],
  },
]

export const sampleCategory: Category = {
  id: 'c1',
  slug: 'cultural-heritage',
  name: 'Cultural & Ancient Kingdoms',
  shortName: 'Cultural & Heritage',
  kicker: 'Heritage & Monasteries',
  description: 'Sigiriya, Polonnaruwa, Dambulla cave sanctuaries, and sacred Anuradhapura stupas.',
  icon: 'temple_buddhist',
  image: null,
  tourCount: 4,
}

export const sampleDestinations: DestinationCard[] = [
  {
    id: 'd1',
    slug: 'ella',
    name: 'Ella',
    tagline: 'Mist-Veiled Peaks, Ravana Legends & Highland Tea Estates',
    summary:
      'Perched on the southern rim of the Central Massif, Ella captivates with mountain vistas and historic stone viaducts.',
    metaLabel: 'Central Hill Country · 1,041m',
    badge: 'Trekker & Tea Sanctuary',
    bestTimeLabel: 'Dec – Apr & Jul – Aug',
    curations: [
      'Dawn trek to Little Adam’s Peak before mist lifts',
      'Nine Arches Viaduct blue train viewing',
      'Single-estate tea tasting with a master planter',
    ],
    region: { slug: 'central-hill-country', name: 'Central Highlands', icon: 'landscape' },
    cover: null,
    latitude: 6.87,
    longitude: 81.05,
    elevation: 1041,
  },
  {
    id: 'd2',
    slug: 'sigiriya-dambulla',
    name: 'Sigiriya & Dambulla',
    tagline: '5th-Century Sky Citadels & Gilded Cave Sanctuaries',
    summary: 'Ascend King Kashyapa’s monolith citadel and explore five sacred cliffside chambers.',
    metaLabel: 'Cultural Triangle · UNESCO',
    badge: null,
    bestTimeLabel: 'Nov – Apr',
    curations: ['Dawn VIP gate ascent', 'Royal water garden picnic', 'Cave fresco analysis with a heritage lecturer'],
    region: { slug: 'cultural-triangle', name: 'Cultural Triangle', icon: 'temple_buddhist' },
    cover: null,
    latitude: 7.95,
    longitude: 80.76,
    elevation: null,
  },
]

export const sampleReviews: ReviewCard[] = [
  {
    id: 'r1',
    guestName: 'Dr. Julian & Claire Montgomery',
    initials: 'JM',
    country: 'GB',
    location: 'Oxford',
    partyLabel: '2 Travelers',
    travellerType: 'couple',
    tourType: 'Grand Odyssey',
    tripLabel: '12-day Grand Odyssey',
    tour: { slug: 'cultural-odyssey', title: 'The Cultural Odyssey' },
    rating: 5,
    title: 'Impeccable timing and deep archaeological insight',
    text: 'Impeccable timing, safe driving through the winding mountain passes, and deep archaeological insights made this our trip of a lifetime. He knew exactly when to arrive at Sigiriya to avoid queues.',
    photo: null,
    tripPhotos: [],
    source: 'tripadvisor',
    travelDate: '2024-02',
    isFeatured: true,
    createdAt: '2024-03-01T00:00:00.000Z',
  },
  {
    id: 'r2',
    guestName: 'David Chen & Family',
    initials: 'DC',
    country: 'SG',
    location: null,
    partyLabel: '4 Travelers',
    travellerType: 'family',
    tourType: 'Family Wonder',
    tripLabel: '9-Day Family Wonder Route',
    tour: null,
    rating: 5,
    title: 'Unrivaled patience with two restless boys',
    text: 'Traveling with a 6-year-old and 9-year-old through tropical climates can be exhausting, but our daily rhythm was designed flawlessly — cold towels, fresh fruit and fifty wild elephants at Minneriya.',
    photo: null,
    tripPhotos: [],
    source: 'google',
    travelDate: '2023-12',
    isFeatured: false,
    createdAt: '2024-01-10T00:00:00.000Z',
  },
]

export const samplePost: BlogCard = {
  id: 'b1',
  slug: 'sigiriya-at-dawn',
  title: 'The Secret Vantage Points of Sigiriya at Sunrise',
  excerpt:
    'Why climbing Pidurangala at 5:15 AM gives you the most breathtaking view of the ancient lion rock before the tour buses arrive.',
  category: { slug: 'culture', label: 'Cultural Insider' },
  tags: ['Cultural Triangle'],
  readingTime: 5,
  cover: null,
  publishedAt: '2026-01-12T00:00:00.000Z',
  isFeatured: true,
  authorName: 'Dinesh Jayasuriya',
}

export const sampleFaqs: FaqItem[] = [
  {
    id: 'f1',
    question: 'When is the ideal season to visit Sri Lanka?',
    answer:
      'Sri Lanka is a year-round destination thanks to two alternating monsoons. When the South and West coasts receive rain (May to September), the North and East enjoy clear skies.',
  },
  {
    id: 'f2',
    question: 'How do I obtain the Tourist Visa / ETA?',
    answer:
      'Most travellers obtain an Electronic Travel Authorization online before arrival. I send every confirmed guest step-by-step guidance.',
  },
  {
    id: 'f3',
    question: 'What is the temple dress code?',
    answer:
      'Shoulders and knees covered; shoes and hats removed at temple thresholds. White or light linen is considered auspicious.',
  },
]

export const sampleRegions: Region[] = [
  {
    id: 'rg1',
    slug: 'south-west-coast',
    name: 'South & West Coast',
    description: null,
    places: 'Galle Fort, Mirissa, Bentota, Colombo',
    icon: 'beach_access',
    bestMonths: ['peak', 'peak', 'peak', 'peak', 'rain', 'rain', 'good', 'good', 'rain', 'rain', 'peak', 'peak'],
    image: null,
    destinationCount: 4,
  },
  {
    id: 'rg2',
    slug: 'national-parks',
    name: 'National Parks & Wildlife',
    description: null,
    places: 'Yala, Wilpattu, Udawalawe, Minneriya',
    icon: 'pets',
    bestMonths: ['good', 'peak', 'peak', 'peak', 'peak', 'peak', 'peak', 'peak', 'peak', 'rain', 'rain', 'good'],
    image: null,
    destinationCount: 4,
  },
]

const iso = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000)
const today = new Date(Date.UTC(2026, 9, 5))
export const sampleAvailability: AvailabilityCalendar = {
  from: iso(today),
  to: iso(addDays(today, 365)),
  ranges: [
    { id: 'a1', startDate: iso(addDays(today, 3)), endDate: iso(addDays(today, 9)), type: 'busy' },
    { id: 'a2', startDate: iso(addDays(today, 12)), endDate: iso(addDays(today, 30)), type: 'available' },
    { id: 'a3', startDate: iso(addDays(today, 40)), endDate: iso(addDays(today, 47)), type: 'busy' },
  ],
}
