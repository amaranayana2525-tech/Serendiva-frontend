import { notFound } from 'next/navigation'

/** Unknown /admin/* paths render the admin 404 inside the shell (instead of falling through to the site routes). */
export default function AdminCatchAllPage() {
  notFound()
}
