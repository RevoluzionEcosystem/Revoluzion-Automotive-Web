import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { HalfcutsClientList } from './HalfcutsClientList'
import { HalfcutSidebarWithSuspense } from '@/components/ui/HalfcutSidebarWithSuspense'
import type { HalfcutWithUser } from '@/lib/supabase/types'

export const metadata: Metadata = {
  title: 'Halfcuts Directory',
  description: 'Explore full car halfcuts, strips, scrap bundles, and multi-component listing kits directly',
}

export const dynamic = 'force-dynamic'

export default async function HalfcutsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; region?: string }>
}) {
  const { q, region } = await searchParams
  const supabase = await createClient()

  // Fetch current session info
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch halfcuts carrying fully loaded parts list records inside pg
  let halfcutsQuery = supabase
    .from('halfcuts')
    .select('*, users!halfcuts_user_id_fkey(username, display_name, avatar_url, phone), halfcut_items(*)')
    .order('created_at', { ascending: false })

  if (region && region !== 'All') {
    halfcutsQuery = halfcutsQuery.eq('location', region)
  }

  const { data: halfcutsList } = await halfcutsQuery

  // Exclude drafts unless owned by authenticated user
  const typedListings = ((halfcutsList ?? []) as HalfcutWithUser[]).filter((hc) => {
    if (hc.status === 'draft') {
      return user && hc.user_id === user.id
    }
    return true
  })

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/40 gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>Halfcuts Hub</h1>
          <p className="text-text-muted text-sm mt-1">Acquire and strip full mechanical setups, conversion kits, and bulk garage spares</p>
        </div>
        <Link
          href="/halfcuts/post"
          className="btn-primary flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider shrink-0"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          <Plus size={16} />
          Post Halfcut Set
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side Filter Sidebar */}
        <HalfcutSidebarWithSuspense />

        {/* Listings Fluid Elements Grid */}
        <div className="flex-1 space-y-6">
          {/* Structured Client component with centered search bar matching Marketplace, fully unified, and handling image overlays */}
          <HalfcutsClientList halfcuts={typedListings} initialQuery={q ?? ''} />
        </div>
      </div>
    </div>
  )
}