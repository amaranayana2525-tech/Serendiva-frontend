/**
 * Icons the admin only uses inside dynamic expressions (`icon={a ? 'x' : 'y'}`), which scripts/build-icons.mjs
 * can't see. Listing them here (`icon: '…'` pattern) keeps them in the sprite. Add new dynamic icon names here.
 */
export const ADMIN_DYNAMIC_ICONS = [
  { icon: 'swap_horiz' },
  { icon: 'add_photo_alternate' },
  { icon: 'logout' },
  { icon: 'progress_activity' },
  { icon: 'visibility' },
  { icon: 'visibility_off' },
  { icon: 'check' },
  { icon: 'content_copy' },
  { icon: 'person' },
] as const
