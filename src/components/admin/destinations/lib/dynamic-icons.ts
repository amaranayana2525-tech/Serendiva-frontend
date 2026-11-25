/**
 * Icons the destinations / regions / reviews / FAQs / availability screens only use inside dynamic expressions
 * (`icon={a ? 'x' : 'y'}`, lookup tables), which scripts/build-icons.mjs can't see. Listing them here with the
 * `icon: '…'` pattern keeps them in the sprite (`npm run icons`).
 */
export const CONTENT_DYNAMIC_ICONS = [
  // destinations editor tabs + status
  { icon: 'badge' },
  { icon: 'auto_awesome' },
  { icon: 'hiking' },
  { icon: 'restaurant' },
  { icon: 'photo_library' },
  { icon: 'travel_explore' },
  { icon: 'public' },
  { icon: 'edit_note' },
  { icon: 'drag_indicator' },
  { icon: 'info' },
  // FAQ scopes
  { icon: 'help' },
  { icon: 'event_available' },
  { icon: 'business_center' },
  { icon: 'map' },
  { icon: 'location_on' },
  // reviews empty states
  { icon: 'task_alt' },
  { icon: 'reviews' },
  // availability dialog
  { icon: 'edit_calendar' },
  { icon: 'calendar_add_on' },
] as const
