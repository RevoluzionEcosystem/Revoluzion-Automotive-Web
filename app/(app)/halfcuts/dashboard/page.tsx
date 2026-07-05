import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { HalfcutDashboardClient } from './HalfcutDashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Halfcuts Dashboard',
  description: 'Manage your halfcut listings and child spare parts dynamically',
}

export const dynamic = 'force-dynamic'

export default async function HalfcutsDashboardPage() {
  const supabase = await createClient()

  // 1. Get current active session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-32 text-center space-y-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>Access Restricted</h2>
        <p className="text-text-secondary text-sm">Please sign in to view your personalized halfcuts dashboard.</p>
        <Link href="/login" className="btn-primary inline-block font-bold">Sign In</Link>
      </div>
    )
  }

  // 2. Fetch all halfcuts owned by the logged-in user
  const { data: halfcutsList } = await supabase
    .from('halfcuts')
    .select('*, halfcut_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const userHalfcuts = halfcutsList ?? []
  
  // Counts
  const totalBundles = userHalfcuts.length
  const activeCount = userHalfcuts.filter(h => h.status === 'active').length
  const draftCount = userHalfcuts.filter(h => h.status === 'draft').length
  const inactiveCount = userHalfcuts.filter(h => h.status === 'inactive').length

  return (
    <HalfcutDashboardClient
      user={user}
      userHalfcuts={userHalfcuts}
      totalBundles={totalBundles}
      activeCount={activeCount}
      draftCount={draftCount}
      inactiveCount={inactiveCount}
    />
  )
}