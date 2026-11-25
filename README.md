# Serendiva Web

The public website **and** the admin dashboard for **Serendiva — Ceylon Private Journeys**, the business of one
licensed private tour guide in Sri Lanka. The UI is a faithful implementation of the Stitch design in
[`design/`](design/); every piece of content (tours, destinations, reviews, blog, gallery, FAQs, availability,
contact details, page photos …) comes from the **Serendiva API** (`../serendiva-api`).

There are **no prices, payments, carts or bookings**. Every page leads to one of two actions: send an inquiry, or
chat on WhatsApp.

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) · Tailwind CSS 3.4 (Stitch tokens) ·
next-intl 4 · React Hook Form + Zod · motion · react-leaflet + OpenStreetMap · react-markdown ·
openapi-typescript + openapi-fetch · Vitest · Playwright

> **Placeholders.** All sample content (guide name, phone numbers, licence numbers, reviews, photos, tours …) comes
> from the API seed and must be replaced by the client — through the admin panel, not in this code. See
> [Placeholder content](#placeholder-content).

---

## Contents

1. [Quick start (Windows PowerShell)](#quick-start-windows-powershell)
2. [Environment variables](#environment-variables)
3. [npm scripts](#npm-scripts)
4. [Architecture](#architecture)
5. [Project structure](#project-structure)
6. [Data fetching, caching and revalidation](#data-fetching-caching-and-revalidation)
7. [Forms](#forms)
8. [The admin dashboard](#the-admin-dashboard)
9. [Languages (i18n)](#languages-i18n)
10. [Managing content (how to …)](#managing-content-how-to-)
11. [Design system: tokens, icons, images](#design-system-tokens-icons-images)
12. [SEO, accessibility and performance](#seo-accessibility-and-performance)
13. [Testing](#testing)
14. [Deploying to Vercel](#deploying-to-vercel)
15. [Placeholder content](#placeholder-content)
16. [Where the build deviates from the Stitch design](#where-the-build-deviates-from-the-stitch-design)
17. [Troubleshooting](#troubleshooting)

---

## Quick start (Windows PowerShell)

Prerequisites: **Node.js 22 LTS** (or newer), npm, and the API running (see `../serendiva-api/README.md` — Docker
Postgres, `npx prisma migrate deploy`, `npm run db:seed`, `npm run dev`).

```powershell
Set-Location serendiva-web
Copy-Item .env.example .env.local        # defaults point at the API on http://localhost:4000
npm install
npm run dev                              # http://localhost:3000
```

- Website: <http://localhost:3000> · Chinese preview: <http://localhost:3000/zh> · German: <http://localhost:3000/de>
- Admin: <http://localhost:3000/admin> — sign in with `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` from the API's
  `.env` (defaults: `admin@serendiva.lk` / `ChangeMe-Serendiva-2026` — **change it** in Admin → Settings → Password).
- `REVALIDATE_SECRET` in `.env.local` must equal `REVALIDATE_SECRET` in the API's `.env` (both examples use the same
  development value), otherwise admin edits are not pushed to the website cache.
- The sample photos are remote design images. Run `npm run media:import-seed` **in the API project** once to download
  them and turn them into optimised WebP files.

Production build locally:

```powershell
npm run build; npm run start             # http://localhost:3000
```

---

## Environment variables

Copy `.env.example` to `.env.local`. `NEXT_PUBLIC_*` values are compiled into the browser bundle at build time —
never put secrets in them.

| Variable | Example | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://www.serendiva.com` | Public origin: canonical URLs, sitemap, Open Graph. No trailing slash. |
| `NEXT_PUBLIC_API_URL` | `https://api.serendiva.com` | API origin used **by the browser** (forms post here; must be in the API's `CORS_ORIGINS`). |
| `API_URL` | *(empty)* | API origin used **by the Next.js server** (server components, sitemap, `/api/v1` rewrite). Defaults to `NEXT_PUBLIC_API_URL`; set an internal URL if you have one. |
| `REVALIDATE_SECRET` | 32+ random chars | Shared with the API. Protects `POST /api/revalidate`. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `94771234567` | Fallback WhatsApp number (digits only) if the CMS has none. |
| `NEXT_PUBLIC_ENABLED_LOCALES` | `en` or `en,zh,de` | Languages offered in the switcher. Others show "coming soon". |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | *(empty)* | Optional Cloudflare Turnstile on forms (pair with the API's `TURNSTILE_SECRET`; the widget's hostnames are this website's domains). Local test key: `1x00000000000000000000AA` (always passes — never in production). |
| `CONTENT_FALLBACK` | `false` | `true` = serve the deprecated `src/content` snapshot when the API is down (always on in `npm run dev`). |
| `IMAGE_REMOTE_HOSTS` | `media.serendiva.com` | Extra image hostnames for `next/image` (e.g. your R2/S3 public bucket domain). |
| `PLAYWRIGHT_BASE_URL`, `PW_CHROMIUM_PATH` | | E2E test target / custom Chromium. |

Generate a secret (cryptographically secure): `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`

---

## npm scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload (rebuilds the icon sprite first). |
| `npm run build` / `npm run start` | Production build / server. The build fetches content from the API to pre-render pages; if the API is down it still succeeds and pages render on first request. |
| `npm run lint` | ESLint (flat config, `eslint-config-next`). |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` (strict). |
| `npm test` | Vitest unit tests (`tests/`, `src/**/__tests__`). |
| `npm run test:e2e` | Playwright end-to-end tests (`e2e/`). |
| `npm run icons` | Rebuilds `public/icons/sprite.svg` from the icon names used in the code + `scripts/icon-allowlist.txt`. |
| `npm run api:types` | Regenerates the typed API client types from the API's OpenAPI document (see below). |
| `npm run content:snapshot` | Writes the deprecated offline fallback snapshot to `src/content/` from a running API. |
| `npm run format` | Prettier (with the Tailwind class sorter). |

---

## Architecture

```
                          ┌──────────────────────────── serendiva-web (this project) ───────────────────────────┐
 Visitor's browser ──────►│ /[locale]/…  public pages: React Server Components, pre-rendered, cached by tag      │
                          │      │  fetch(API_URL/api/v1/… ?locale=…, { next: { tags, revalidate: 3600 } })     │
                          │      ▼                                                                               │
                          │  src/lib/api/public.ts ──────────────────────────────────────────┐                   │
 Forms (inquiry, proposal,│  client components POST directly to NEXT_PUBLIC_API_URL (CORS)    │                   │
 newsletter, review) ─────┼──────────────────────────────────────────────────────────────────┤                   │
                          │ /admin/…   admin SPA screens (client components)                  │                   │
 Guide's browser ────────►│      │  same-origin calls to /api/v1/admin/* → rewrite → API      │                   │
                          │ /api/revalidate  ◄── API calls this after every content change    │                   │
                          └───────────────────────────────────────────────────────────────────┼───────────────────┘
                                                                                              ▼
                                                                         serendiva-api (Fastify + PostgreSQL)
```

- **Server components fetch, client components interact.** Pages are server components that call
  `src/lib/api/public.ts`; interactive bits (filters, sliders, forms, lightbox, maps) are small client components
  that receive data as props.
- **Static where possible.** All public pages are pre-rendered (`●` in the build output) except `/contact`, which
  reads the pre-fill query string on the server. Filters (tours, destinations, reviews, gallery, blog) work on the
  full list in the browser and keep their state in the URL, so those pages stay static too.
- **One typed contract.** `src/lib/api/schema.d.ts` is generated from the API's OpenAPI document; every response
  and request body is typed end to end.
- **The admin panel lives in the same app** (`/admin`, English UI, not localised, `noindex`) and talks to the API
  through a same-origin rewrite so the API's httpOnly session cookies are first-party.

---

## Project structure

```
design/                         the client's Stitch export (read-only reference: code.html + screen.png per screen, DESIGN.md)
public/brand/                   logo (original), web logo, default social image   public/icons/sprite.svg  (generated)
scripts/                        build-icons.mjs, icon-allowlist.txt, api-types.mjs, snapshot-content.mjs
src/
  app/
    [locale]/layout.tsx         <html>, fonts, NextIntlClientProvider
    [locale]/(site)/…           public pages (one folder per route: page.tsx, usually loading.tsx); the (site) layout
                                renders SiteChrome (skip link, header, footer, WhatsApp button)
    [locale]/not-found.tsx      localised 404     [locale]/[...rest]/page.tsx  catch-all → 404
    admin/…                     admin panel: login, (panel)/<section>/page.tsx
    api/revalidate/route.ts     cache-tag webhook called by the API
    sitemap.ts  robots.ts  icon.png  apple-icon.png
  components/
    ui/                         design-system primitives: Icon, Button, Container, SectionHeading, Chip, Badge, Stars,
                                Accordion, Tabs, Field/Input/…, Skeleton, EmptyState, ErrorState, SmartImage,
                                Breadcrumbs, Lightbox, Reveal, CountUp, Pagination, Dialog, Markdown …
    layout/                     Header, MobileNav, LanguageSwitcher, Footer, WhatsAppButton, StickyInquiryTab, MobileActionBar
    cards/                      TourCard, FeaturedTourCard, CategoryTile, DestinationCard, ReviewCard, BlogCard
    sections/                   FaqSection, FinalCta, AvailabilityCalendar, BestTimeMatrix, InquirySidebarCard …
    forms/                      NewsletterForm, Honeypot, Turnstile, FormStatus
    seo/                        JsonLd + builders (TravelAgency, TouristTrip, FAQPage, BreadcrumbList, BlogPosting)
    home/ tours/ destinations/ corporate/ about/ gallery/ reviews/ contact/ travel-guide/ blog/ responsible/ quiz/
    legal/ newsletter/          page-specific sections
    admin/                      kit/ (admin design system), shell/, auth/, dashboard/, leads/, tours/, destinations/,
                                reviews/, faqs/, availability/, blog/, gallery/, newsletter/, media/, settings/
  i18n/                         routing.ts, navigation.ts (Link, useRouter…), request.ts, messages.ts
  lib/
    api/                        schema.d.ts (generated), types.ts, client.ts, public.ts, forms.ts, errors.ts, tags.ts
    admin/                      admin API client (auto refresh), hooks, translatable helpers, unsaved-changes guard
    validation/                 Zod schemas for the public forms (mirror the API limits)
    env.ts seo.ts whatsapp.ts prefill.ts quiz.ts format.ts utils.ts …
  messages/<locale>/<namespace>.json   all UI text (English is the source; zh/de fall back to English)
  content/                      DEPRECATED offline fallback snapshot (see src/content/README.md)
  proxy.ts                      next-intl routing + admin guard (Next 16's name for middleware)
tests/ e2e/                     unit and end-to-end tests
```

---

## Data fetching, caching and revalidation

1. A page calls e.g. `getTour(locale, slug)` from `src/lib/api/public.ts`.
2. The request goes to `API_URL/api/v1/tours/<slug>?locale=<locale>` with
   `next: { tags: ['tour:<slug>', 'tours', 'reviews', 'faqs'], revalidate: 3600 }` — Next.js caches the response.
3. When the guide saves a tour in the admin, the **API** calls `POST /api/revalidate` with
   `{ tags: ['tours', 'tour:<slug>', 'sitemap'] }` and the header `x-revalidate-secret`.
4. The route handler calls `revalidateTag(tag, { expire: 0 })`; the next visitor gets fresh data and the page is
   re-rendered (also works for unpublishing — the page then returns 404).

Tags (identical in `src/lib/api/tags.ts` and the API's `src/lib/revalidate.ts`): `tours`, `tour:<slug>`,
`categories`, `destinations`, `destination:<slug>`, `regions`, `reviews`, `faqs`, `blog`, `blog:<slug>`,
`gallery`, `availability`, `settings`, `sitemap`.

Every data-driven section is its own async server component inside `<Suspense>` with a skeleton fallback; it
catches API errors and shows `<ErrorState>` (with retry) and shows `<EmptyState>` for empty lists — one failing
section never breaks the whole page. Detail pages call `notFound()` for unknown slugs (real HTTP 404).

**Regenerating the typed client** after the API changes:

```powershell
# API running on :4000
npm run api:types
# or from the file the API exports (`npm run openapi:export` in serendiva-api)
npm run api:types -- ..\serendiva-api\openapi.json
```

`src/lib/api/types.ts` gives friendly names (`TourCard`, `TourDetail`, `AdminTour`, …).

**Offline fallback (deprecated).** `src/content/*.json` is an English snapshot of the API responses. In development
(or with `CONTENT_FALLBACK=true`) a failed API call falls back to it with a console warning, so designers can work
without the API. It is not used in production by default and should not be edited — edit content in the admin.

---

## Forms

| Form | Where | API |
|---|---|---|
| Hero quick-inquiry bar | Home | navigates to `/contact` with pre-filled query params |
| 4-step trip planner (wizard) | `/contact` | `POST /api/v1/inquiries` |
| Tour inquiry (pre-filled with the tour) | `/tours/[slug]` | `POST /api/v1/inquiries` |
| "Include this destination in my trip" | `/destinations/[slug]` | `POST /api/v1/inquiries` |
| Corporate proposal (+ optional PDF/DOCX ≤ 5 MB) | `/corporate` | `POST /api/v1/corporate-proposals` (multipart) |
| Newsletter (double opt-in) | footer, blog | `POST /api/v1/newsletter/subscribe` → email → `/newsletter/confirm?token=` |
| Share your experience (review, moderated) | `/reviews/share` | `POST /api/v1/reviews` |
| Trip quiz → recommendation → pre-filled inquiry | `/trip-quiz` | scoring in `src/lib/quiz.ts`, then `/contact?…` |

All forms: Zod validation in the browser for instant feedback, server validation errors mapped onto the matching
fields, friendly messages for network errors and 429 (too many requests) and a hidden honeypot field. Inquiries and
proposals show their reference code on the success screen (`SRD-2026-0001`, `SRD-C-2026-0001`) and support optional
Turnstile. Pre-fill helpers live in `src/lib/prefill.ts`: `contactHref({ tour, destination, interests, month, party,
adults, children, message, source })` for `<Link>`, `contactPath(…)` for a plain `/contact?…` string.

WhatsApp links are built by `src/lib/whatsapp.ts` with a pre-filled message that names the page or tour.

---

## The admin dashboard

URL: `/admin` (never linked from the site, `noindex` header + meta). Sections: Dashboard, Inquiries, Corporate
Proposals, Tours (+ Categories), Destinations (+ Regions), Reviews, Blog, Gallery, FAQs, Page Content, Availability,
Newsletter, Media, Settings.

**Sign-in and sessions.** `/admin/login` posts to the API through the same-origin rewrite. The API sets three
httpOnly cookies: `sd_access` (15-minute JWT), `sd_refresh` (30-day rotating refresh token, sent only to the auth
endpoints) and `sd_session` (an indicator). `src/proxy.ts` redirects every `/admin/*` request without
`sd_session` to the login page. The admin API client (`src/lib/admin/client.ts`) silently refreshes an expired
access token once and retries; if that fails it sends you to the login page. Logout revokes the session on the server.
After 5 wrong passwords the account is locked for 15 minutes (doubling on repeat).

**What the guide can do**

- **Dashboard** — new inquiries, this week/month, reply rate, pending reviews, newsletter subscribers, inquiries by
  month / country / tour / source page, latest inquiries.
- **Inquiries & proposals** — filter (status tabs, search, dates, tour, country), status changes, internal notes,
  detail drawer with **WhatsApp** and **email reply** buttons, resend confirmation emails, proposal attachment
  download, CSV export. Links in notification emails open the right inquiry (`/admin/inquiries?id=…`).
- **Tours** — list with drag-to-reorder and publish switches; editor with tabs Details · Itinerary (days with
  drag-to-reorder, map stops) · Gallery · Destinations · SEO; EN / 中文 / DE translation tabs for every text field.
- **Destinations & regions** — full destination page content (quick facts, experiences, stays, food, field notes,
  map points, gallery), region best-months editor.
- **Reviews** — approve / reject / feature, edit, add imported reviews.
- **Blog** — Markdown editor with live preview (rendered exactly like the public article), cover, category, tags, SEO.
- **Gallery** — multi-upload into a category, drag-to-reorder, captions, videos.
- **FAQs** — per scope (general, booking, corporate, reviews page, travel guide, tour, destination), drag-to-reorder.
- **Page Content** — the static page copy of every page (headings, paragraphs, quotes, testimonials, privacy and
  terms). `src/messages/en/*.json` stay the defaults; only changed texts are stored (API `/page-content`) and merged
  over them in `src/i18n/messages.ts`. Which paths are editable is defined in `src/lib/page-content/registry.ts`
  (content only — form labels and UI text stay in the JSON files). Overrides whose `{placeholders}` / `<tags>` no
  longer match the default are ignored, and quotes/testimonials marked `hideable` can be switched off.
  Sections with a `list` (services, process steps, pillars, stats…) can be re-ordered, shortened and — unless the
  items have their own photo — extended: the components iterate `listEntries(tl.raw('items'), CONSTANTS)`
  (`src/lib/page-content/lists.ts`) instead of their constants, which now only supply per-item icons, tones and
  photo slots by key.
- **Availability** — calendar of busy / available ranges shown on `/contact` and tour pages.
- **Newsletter** — subscribers, CSV export.
- **Media library** — upload (WebP variants are generated by the API), alt text per language, usage list, delete
  (blocked while a file is in use).
- **Settings** — contact details, WhatsApp number, social links, guide profile and licences, counters, trust badges,
  hero slides, SEO defaults, corporate clients, Instagram strip, **page images** (every photo on the static pages),
  change password.

Every screen has loading skeletons, error panels, empty states, success/error toasts, confirmation before deletes and
a warning before leaving unsaved changes. The admin design system lives in `src/components/admin/kit` (import from
`@/components/admin/kit`).

---

## Languages (i18n)

- Locales: `en` (default, URLs without prefix: `/tours`), `zh` (`/zh/tours`), `de` (`/de/tours`).
- **UI text** is in `src/messages/<locale>/<namespace>.json`. English is the source of truth (keys are typed from the
  English files). Missing keys in `zh`/`de` fall back to English automatically.
- **Content** (tour titles, descriptions …) is translated in the admin (EN / 中文 / DE tabs). The API falls back to
  English for anything untranslated, and every request passes the current locale.

**Launching Chinese (same for German):**

1. Translate the UI files: copy each `src/messages/en/*.json` to `src/messages/zh/` and translate the values
   (keep the keys; you can do it file by file — untranslated files keep showing English).
2. Translate the content in the admin (tours, destinations, FAQs, blog, settings).
3. Set `NEXT_PUBLIC_ENABLED_LOCALES=en,zh` and redeploy. The switcher enables 中文, the sitemap and `hreflang` tags
   include `/zh/…` pages.

---

## Managing content (how to …)

Content is managed in the **admin panel**; the website updates within seconds through the revalidation webhook.

- **Add a tour** — Admin → Tours → *New tour*. Fill EN details, add days on the *Itinerary* tab (drag to reorder;
  add map stops with latitude/longitude for the route map), choose a cover and gallery, link destinations,
  categories, traveller types and seasons (used by the trip quiz), then *Publish*. It appears on `/tours`, in the
  sitemap and (if *Featured*) on the home page.
- **Add a destination** — Admin → Destinations → *New destination*; pick its region, fill the blocks you need (empty
  blocks are simply not shown), add map points, publish.
- **Write a blog post** — Admin → Blog → *New post*; write Markdown (`##` headings build the table of contents),
  insert images from the media library, set category/tags/cover, publish.
- **Add a translation** — open any item, switch to 中文 or DE, fill the fields (English shows as placeholder), save.
- **Replace images** — Admin → Media → upload your photos (JPG/PNG/WebP, ≤ 10 MB; the API makes WebP sizes and a
  blur placeholder). Then pick them in the item that uses them, or in Admin → Settings → **Pages & hero images** for the
  photos on Home, Tours, About, Contact, Corporate, Quiz, Travel guide and Responsible travel. Delete the old sample image
  afterwards (the library shows where each file is used).
- **Change contact details / WhatsApp / licence numbers / counters** — Admin → Settings.
- **Block dates** — Admin → Availability.
- **Approve a guest review** — Admin → Reviews → *Pending* → Approve (and *Feature* it to show it on the home page).
- **Static page text** (headings and paragraphs that are not CMS content, e.g. the About story, travel-guide
  articles, legal pages) lives in `src/messages/en/<page>.json` — edit the JSON and redeploy.

---

## Design system: tokens, icons, images

- **Tailwind 3.4 with the exact Stitch config** (`tailwind.config.ts`): colour roles (`primary #003441`,
  `primary-container #0f4c5c` ocean teal, `secondary #9c441e` cinnamon, `tertiary` tea green, `surface #fff9ee` sand …),
  spacing tokens (`px-margin`, `gap-gutter`, `py-space-3xl`), type scale (`font-display-lg text-display-lg`,
  `text-headline-xl`, `text-body-md`, `text-label-md` …), radii. Stitch markup was ported class-for-class, so the
  rendering matches the design. Never invent colours — use the tokens. `cn()` (clsx + tailwind-merge) knows them.
- **Fonts**: Playfair Display (headings) and Inter (body), self-hosted from `@fontsource-variable/*` via `next/font/local`.
- **Icons**: Material Symbols Outlined as an SVG sprite (no icon font): `<Icon name="arrow_forward" filled? />`.
  Sizes follow text size (`text-sm`, `text-2xl`). Icons used in code are found automatically; icons chosen in the
  CMS must be in `scripts/icon-allowlist.txt` (the admin icon picker only offers those). Run `npm run icons`.
- **Images**: always `<SmartImage image={dto.cover} fill sizes="…" />` (wraps `next/image`, uses the API's blur
  placeholder, shows a sand gradient when an image is missing). Remote hosts: `lh3.googleusercontent.com` (sample
  photos), the API host, and `IMAGE_REMOTE_HOSTS`.
- **Motion**: `<Reveal>` fade-up on scroll (motion's `LazyMotion`), disabled for `prefers-reduced-motion`; the hero
  slider stops auto-playing too.
- **Logo**: `public/brand/serendiva-logo.png` (unchanged original); favicon, app icons and the default social image
  were generated from it.

---

## SEO, accessibility and performance

- Per-page title, description (trimmed to 160 characters), canonical URL, Open Graph and Twitter tags
  (`buildMetadata` in `src/lib/seo.ts`); `hreflang` alternates for enabled locales only.
- JSON-LD: `TravelAgency` (home, with `AggregateRating` only when real approved reviews exist), `TouristTrip` (tours),
  `FAQPage` (wherever FAQs appear), `BreadcrumbList`, `BlogPosting`.
- `sitemap.xml` from the API's `/sitemap-data` (all published tours, destinations and posts + static pages);
  `robots.txt` disallows `/admin` and `/api`.
- Accessibility: one `<h1>` per page, landmarks, skip link, visible focus, keyboard support for menus, accordions,
  tabs, carousel, lightbox (focus trap, ←/→/Esc), forms with labels and linked errors, 44 px touch targets,
  AA colour contrast from the Stitch palette, reduced motion.
- Performance: static pre-rendering, `next/image` (AVIF/WebP, responsive sizes, lazy loading, blur placeholders),
  self-hosted fonts, SVG sprite, maps and lightbox loaded on demand (`next/dynamic`), minimal client JavaScript.
- Security headers (CSP, HSTS in production, X-Frame-Options, Referrer-Policy, Permissions-Policy) in `next.config.ts`.

---

## Testing

```powershell
npm test                                   # unit tests (Vitest): validation, WhatsApp links, quiz scoring, prefill,
                                           # form error mapping, revalidate route, content fallback, admin helpers …
$env:PLAYWRIGHT_BASE_URL="http://localhost:3000"; npm run test:e2e -- --workers=1
                                           # end-to-end: submit inquiry, filter tours, open lightbox, corporate
                                           # proposal, newsletter, quiz, reviews, mobile menu …
```

Install the Playwright browser once with `npx playwright install chromium`. Without `PLAYWRIGHT_BASE_URL` the test
runner uses <http://localhost:3000> and starts `npm run dev` itself if nothing is running there; with it, start your
server first (a production build — `npm run build; npm run start` — is faster and more stable for E2E). Most E2E tests mock the API's form endpoints; set `E2E_REAL_API=1` to also run
the real inquiry submission.

---

## Deploying to Vercel

1. Deploy the API first (see `../serendiva-api/docs/DEPLOYMENT.md`) and note its URL, e.g. `https://api.serendiva.com`.
2. Import this folder as a Vercel project (framework: Next.js, root directory `serendiva-web`, Node 22).
3. Environment variables (Production): `NEXT_PUBLIC_SITE_URL=https://www.serendiva.com`,
   `NEXT_PUBLIC_API_URL=https://api.serendiva.com`, `REVALIDATE_SECRET=<same as the API>`,
   `NEXT_PUBLIC_ENABLED_LOCALES=en`, `IMAGE_REMOTE_HOSTS=<your media domain>` (+ Turnstile key if used).
4. On the API set `FRONTEND_URL=https://www.serendiva.com` and add the site origin to `CORS_ORIGINS`.
5. Add your domain in Vercel. The admin works at `https://www.serendiva.com/admin` — its API calls go through the
   `/api/v1` rewrite, so cookies are first-party and no cookie-domain setup is needed (works even if the API is on a
   completely different domain).
6. After the first deploy: sign in, change the admin password, replace the sample content and photos.

Checklist: unique long secrets, HTTPS everywhere, `NEXT_PUBLIC_SITE_URL` correct (canonical URLs and sitemap),
Search Console sitemap submitted, API backups enabled.

---

## Placeholder content

Everything below is sample data from the API seed / design mock-up and must be replaced by the client:

- Guide name and portraits ("Dinesh Jayasuriya"), licence numbers (SLTDA/SQA/NTGL/01482, TS/2024/091), phone numbers
  (+94 11 234 5678, WhatsApp +94 77 123 4567), email (private@serendiva.lk), address, map coordinates.
- Counters (14+ years, 2,400+ travellers, 680+ tours), "Travelers' Choice" badge text, corporate client names.
- All tours, itineraries, hotel names, destinations, reviews (names, quotes, photos), FAQs, blog posts, gallery,
  videos (YouTube URLs `PLACEHOLD0…`), availability ranges, social links.
- All photos (design stock images hosted on Google's image CDN — import them, then replace them).
- Static page copy in `src/messages/en/*.json` (About story, travel guide, legal pages — have the legal pages reviewed).

---

## Where the build deviates from the Stitch design

- **Home hero**: the Stitch export renders the slide photos *behind* the page (a `-z-10` stacking bug), producing a
  blank sand hero with white text. The intended design — full-bleed photo slides under the teal scrim — is implemented.
  The same fix applies to the final call-to-action banner.
- **Header**: one consistent header/footer on every page (a few Stitch screens had slight variants). The circular
  "person" icon links to `/about` ("Meet your guide") because visitors have no accounts. A mobile menu (drawer) and a
  mobile bottom bar (WhatsApp + Inquire) were added — Stitch has no mobile navigation.
- **Data instead of hard-coded copy**: tours, reviews, destinations, FAQs, counters and contact numbers come from the
  API, so counts and texts follow the real data (e.g. "20 verified reviews" instead of "342").
- **Business rules**: wording that implied payments, deposits or online booking was rephrased; the voice is first
  person ("I", "my").
- **Additions required by the brief**: availability calendar on `/contact` and tour pages, Leaflet maps, loading
  skeletons, error/empty states, review submission page, newsletter confirm pages, 404, privacy and terms pages
  (built from the same components).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Pages show "This section couldn't be loaded" | The API isn't reachable at `API_URL`/`NEXT_PUBLIC_API_URL`. Start it (`npm run dev` in `serendiva-api`). |
| Forms say "I couldn't reach the server" | The API's `CORS_ORIGINS`/`FRONTEND_URL` must include this site's origin (e.g. `http://localhost:3000`). |
| Admin edits don't appear on the site | `REVALIDATE_SECRET` differs between the two projects, or the API's `FRONTEND_URL` is wrong. Check the API log for "revalidation request was rejected". |
| Images don't show | Add the image host to `IMAGE_REMOTE_HOSTS` (production) or run `npm run media:import-seed` in the API. |
| An icon is missing | Add the name to `scripts/icon-allowlist.txt` and run `npm run icons`. |
| "Another next dev server is already running" | Next 16 allows one `next dev` per project; stop the other one. |
| Admin keeps returning to the login page | The API's cookies aren't reaching the browser: use the `/api/v1` rewrite (default) and make sure `API_URL` is correct. Login is limited to 10 attempts per 15 minutes. |
