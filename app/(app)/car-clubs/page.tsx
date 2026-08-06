import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SafeImage } from '@/components/ui/SafeImage'
import { Users } from 'lucide-react'
import type { Metadata } from 'next'
import { CreateClubDialog } from '@/components/ui/CreateClubDialog'
import { CarClubsSidebar } from '@/components/ui/CarClubsSidebar'
import { CarClubSearchWithSuspense } from '@/components/ui/CarClubSearchWithSuspense'

export const metadata: Metadata = {
  title: 'Car Clubs',
  description: 'Discover automotive clubs and car communities across Malaysia',
}

interface Club {
  id: string
  name: string
  description?: string
  avatar_url?: string
  banner_url?: string
  location?: string
  member_count?: number
  created_at?: string
}

export default async function CarClubsPage({ searchParams }: { searchParams: Promise<{ location?: string; q?: string }> }) {
  const supabase = await createClient()
  const { location: activeLocation, q } = await searchParams

  // Fetch active club names for client type-ahead predictive suggestions
  const { data: suggestions } = await supabase
    .from('car_clubs')
    .select('name')
  const allClubNames = (suggestions ?? []).map(item => item.name)

  // Fetch verified clubs directly from PG database table car_clubs
  let clubs: Club[] = []
  try {
    let query = supabase
      .from('car_clubs')
      .select('*')
      .order('member_count', { ascending: false })

    if (activeLocation && activeLocation !== 'All') {
      query = query.eq('location', activeLocation)
    }

    if (q && q.trim()) {
      const cleanQ = q.trim()
      query = query.or(`name.ilike.%${cleanQ}%,description.ilike.%${cleanQ}%`)
    }

    const { data } = await query
    clubs = (data as Club[]) ?? []
  } catch (err) {
    clubs = []
  }

  // Common location list across Malaysia hubs to use as filtering
  const STATES = ['All', 'Selangor', 'Kuala Lumpur', 'Penang', 'Johor', 'Pahang', 'Sabah', 'Sarawak', 'Nationwide']

  const getHrefForLocation = (st: string) => {
    if (st === 'All') return '/car-clubs'
    return `/car-clubs?location=${encodeURIComponent(st)}`
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>
            Car Clubs
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Discover official automotive communities, VTEC runner crews, stance alliances & local car clubs
          </p>
        </div>
        <CreateClubDialog />
      </div>

      {/* Main split routing container */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation column */}
        <CarClubsSidebar activeLocation={activeLocation || 'All'} />

        {/* Dynamic Clubs grid stream */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Typo-tolerant Type-ahead Predictive Search Bar */}
          <div className="flex justify-center w-full px-2 sm:px-4">
            <CarClubSearchWithSuspense allClubNames={allClubNames} />
          </div>

          {/* Quick Hub State Navigator Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/20 border border-slate-900 rounded-xl px-4 py-3">
            <span className="text-xs text-text-secondary">
              Viewing <strong className="text-primary font-mono">{clubs.length}</strong> official automotive clubs across Malaysia
            </span>

            <div className="flex flex-wrap gap-1.5 bg-slate-900/40 p-1 rounded-xl border border-slate-800">
              {['All', 'Selangor', 'Kuala Lumpur', 'Penang', 'Johor'].map((st) => {
                const isActive = activeLocation ? activeLocation === st : st === 'All'
                return (
                  <Link
                    key={st}
                    href={getHrefForLocation(st)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-black font-black'
                        : 'text-text-muted hover:text-white hover:bg-white/5'
                    }`}
                    style={{ fontFamily: 'var(--font-orbitron)' }}
                  >
                    {st}
                  </Link>
                )
              })}
            </div>
          </div>

          {clubs.length === 0 ? (
            <div className="p-12 text-center text-text-muted bg-surface/5 border border-border/60 rounded-2xl flex flex-col items-center justify-center space-y-3">
              <Users size={48} className="text-primary/20 animate-pulse" />
              <p className="text-sm font-bold uppercase tracking-widest text-[#8A90A0]" style={{ fontFamily: 'var(--font-orbitron)' }}>
                No Clubs Found
              </p>
              <p className="text-xs max-w-sm leading-relaxed">
                No established car groups are registered under this hub. Be the first to launch or establish a new local automotive club!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in pb-16">
              {clubs.map((club) => (
                <Link
                  key={club.id}
                  href={`/car-clubs/${club.id}`}
                  className="group relative flex flex-col justify-between h-90 rounded-2xl bg-linear-to-b from-[#181d29] to-[#0d1017] border border-white/5 hover:border-white/10 transition-all duration-300 cursor-pointer overflow-hidden text-left"
                >
                  {/* Banner Area */}
                  <div className="relative w-full h-45 bg-[#0e1017] overflow-hidden shrink-0">
                    <SafeImage
                      src={club.banner_url || ''}
                      alt={club.name}
                      fill
                      className="object-cover group-hover:scale-103 transition-transform duration-500"
                      fallbackSrc="/cover-image/cover-image.jpg"
                    />

                    {club.location && (
                      <span 
                        className="absolute top-3 right-3 py-1 px-2.5 rounded-full border border-white/10 bg-black/60 backdrop-blur-sm text-[10px] font-bold font-mono text-white transition-all z-10 hover:border-white/30"
                        style={{ fontFamily: 'var(--font-orbitron)' }}
                      >
                        {club.location}
                      </span>
                    )}
                  </div>

                  {/* Info Container */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors leading-tight line-clamp-1">
                        {club.name}
                      </h3>
                      <p className="text-xs text-text-muted line-clamp-3 leading-relaxed" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
                        {club.description || 'Welcome to our official automotive group!'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5" style={{ fontFamily: 'var(--font-orbitron)' }}>
                        <Users size={12} className="text-primary" />
                        {club.member_count ?? 1} Members
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary group-hover:translate-x-1 transition-transform duration-200" style={{ fontFamily: 'var(--font-orbitron)' }}>
                        View Club &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}