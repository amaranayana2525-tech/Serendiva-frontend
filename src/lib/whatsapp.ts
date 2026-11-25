import { publicEnv } from './env'

/** Message templates — pass `t.raw('whatsapp')` / the `common.whatsapp` messages so the text is localised. */
export interface WhatsAppTemplates {
  default: string
  page: string
  tour: string
  destination: string
  corporate: string
}

/** Strips everything but digits ("+94 77 123 4567" → "94771234567"). */
export function normalizeWhatsAppNumber(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '')
}

/** The number to use: settings.contact.whatsapp, falling back to NEXT_PUBLIC_WHATSAPP_NUMBER. */
export function resolveWhatsAppNumber(settingsNumber?: string | null): string {
  return normalizeWhatsAppNumber(settingsNumber) || publicEnv.whatsappNumber
}

/**
 * Builds a wa.me deep link. Without a number (none configured) WhatsApp opens the share sheet with the text.
 * @example waLink('+94 77 123 4567', 'Hello') → 'https://wa.me/94771234567?text=Hello'
 */
export function waLink(number: string | null | undefined, message?: string): string {
  const digits = resolveWhatsAppNumber(number)
  const text = message?.trim()
  const query = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${digits}${query}`
}

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match)

export interface WhatsAppMessageOptions {
  templates: WhatsAppTemplates
  /** Human page name, e.g. "Destinations" → "I'm on your “Destinations” page…" */
  page?: string
  /** Tour title (takes precedence over destination/page). */
  tourTitle?: string
  /** Destination name. */
  destinationName?: string
  /** Corporate / group context. */
  corporate?: boolean
}

/** Pre-filled WhatsApp message: tour → destination → corporate → page → default. */
export function buildWhatsAppMessage({
  templates,
  page,
  tourTitle,
  destinationName,
  corporate,
}: WhatsAppMessageOptions): string {
  if (tourTitle) return fill(templates.tour, { tour: tourTitle })
  if (destinationName) return fill(templates.destination, { destination: destinationName })
  if (corporate) return templates.corporate
  if (page) return fill(templates.page, { page })
  return templates.default
}

/** Field labels of the WhatsApp fallback summary (messages `common.whatsapp.fallback.fields`). */
export interface InquirySummaryLabels {
  name: string
  email: string
  whatsapp: string
  country: string
  party: string
  guests: string
  dates: string
  flexibility: string
  duration: string
  pace: string
  stay: string
  interests: string
  about: string
  message: string
}

/** The fields of an inquiry the WhatsApp fallback repeats (a subset of InquiryBody). */
export interface InquirySummaryInput {
  name?: string
  email?: string
  whatsapp?: string
  country?: string
  partyType?: string
  adults?: number
  children?: number
  travelStart?: string
  travelEnd?: string
  travelWindow?: string
  flexibility?: string
  durationPreference?: string
  pace?: string
  stayStyle?: string
  interests?: string[]
  message?: string
}

/**
 * Plain-text summary for the "send it on WhatsApp instead" fallback when the inquiry form cannot be sent:
 * the intro line, then one "Label: value" line per filled field (the guide gets everything the form held).
 */
export function inquirySummaryText(
  body: InquirySummaryInput,
  opts: { intro: string; labels: InquirySummaryLabels; about?: string; partyLabel?: string },
): string {
  const { labels } = opts
  const dates =
    body.travelStart && body.travelEnd ? `${body.travelStart} – ${body.travelEnd}` : (body.travelStart ?? body.travelWindow)
  const guests =
    body.adults !== undefined ? `${body.adults}${body.children ? ` + ${body.children}` : ''}` : undefined
  const lines: [string, string | undefined][] = [
    [labels.name, body.name],
    [labels.email, body.email],
    [labels.whatsapp, body.whatsapp],
    [labels.country, body.country],
    [labels.party, opts.partyLabel ?? body.partyType],
    [labels.guests, guests],
    [labels.dates, dates],
    [labels.flexibility, body.flexibility],
    [labels.duration, body.durationPreference],
    [labels.pace, body.pace],
    [labels.stay, body.stayStyle],
    [labels.interests, body.interests?.length ? body.interests.join(', ') : undefined],
    [labels.about, opts.about],
    [labels.message, body.message],
  ]
  const filled = lines.filter(([, v]) => v !== undefined && String(v).trim() !== '').map(([k, v]) => `${k}: ${v}`)
  return [opts.intro, '', ...filled].join('\n').slice(0, 3500)
}
