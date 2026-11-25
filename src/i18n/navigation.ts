import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

/** Locale-aware navigation APIs. Always use these (not next/link / next/navigation) for site routes. */
export const { Link, redirect, permanentRedirect, usePathname, useRouter, getPathname } = createNavigation(routing)
