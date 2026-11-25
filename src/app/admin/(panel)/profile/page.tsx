import type { Metadata } from 'next'
import { ProfileScreen } from '@/components/admin/profile/ProfileScreen'
import admin from '@/messages/en/admin.json'

export const metadata: Metadata = { title: admin.profile.title }

export default function AdminProfilePage() {
  return <ProfileScreen />
}
