/**
 * Icons the media / gallery / blog / newsletter / settings screens only use in dynamic expressions, which
 * scripts/build-icons.mjs can't see. Listing them here (`icon: '…'` pattern) keeps them in the sprite.
 */
export const ADMIN_LIBRARY_DYNAMIC_ICONS = [
  { icon: 'map' },
  { icon: 'photo_library' },
  { icon: 'location_on' },
  { icon: 'view_agenda' },
  { icon: 'public' },
  { icon: 'category' },
  { icon: 'article' },
  { icon: 'reviews' },
  { icon: 'business_center' },
  { icon: 'settings' },
  { icon: 'link' },
  { icon: 'upload' },
  { icon: 'close' },
  { icon: 'image' },
  { icon: 'description' },
  { icon: 'hide_image' },
  { icon: 'error' },
  { icon: 'drag_indicator' },
  { icon: 'checklist' },
] as const

/** Icons of the settings sections and social fields (config objects, not `icon=` props). */
export const ADMIN_SETTINGS_ICONS = [
  { icon: 'photo_camera' },
  { icon: 'alternate_email' },
  { icon: 'thumb_up' },
  { icon: 'travel_explore' },
  { icon: 'star' },
  { icon: 'smart_display' },
  { icon: 'contact_phone' },
  { icon: 'share' },
  { icon: 'badge' },
  { icon: 'leaderboard' },
  { icon: 'verified' },
  { icon: 'slideshow' },
  { icon: 'lock_reset' },
] as const
