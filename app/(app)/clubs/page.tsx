import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { Users, MapPin, Calendar, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Clubs',
  description: 'Discover automotive clubs and car communities across Malaysia',
}

export const revalidate = 600

// Define a simple Club type for display purposes
interface Club {
  id: string
  name: string
  description?: string
  logo_url?: string
  banner_url?: string
  location?: string
  member_count?: number
  created_at?: string
  category?: string
}

export default async function ClubsPage() {
  const supabase = await createClient()

  // Attempt to fetch clubs — table may not exist yet
  let clubs: Club[] = []
  try {
    const { data } = await supabase
      .from('clubs')
      .select('*')
      .order('member_count', { ascending: false })
      .limit(24)
    clubs = (data as Club[]) ?? []
  } catch {
    clubs = []
  }

  // Fallback demo clubs if none in DB
  const displayClubs: Club[] = clubs.length > 0 ? clubs : [
    { id: '1', name: 'KL Modified Club', description: 'Kuala Lumpur\'s premier modified car community', location: 'Kuala Lumpur', member_count: 342, category: 'Modified' },
    { id: '2', name: 'Malaysian JDM Owners', description: 'For lovers of Japanese domestic market vehicles', location: 'Selangor', member_count: 891, category: 'JDM' },
    { id: '3', name: 'Penang Drift Alliance', description: 'Drift enthusiasts in the Pearl of the Orient', location: 'Penang', member_count: 127, category: 'Drift' },
    { id: '4', name: 'MY Classic Cars', description: 'Preserving Malaysia\'s automotive heritage', location: 'Nationwide', member_count: 204, category: 'Classic' },
    { id: '5', name: 'EV Malaysia', description: 'Electric vehicle owners and advocates', location: 'Nationwide', member_count: 418, category: 'EV' },
    { id: '6', name: 'Johor Track Days', description: 'Track day enthusiasts and time attack racers', location: 'Johor', member_count: 156, category: 'Track' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Clubs</h1>
          <p className="text-text-muted text-sm mt-1">{displayClubs.length}+ communities to join</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayClubs.map((club) => (
          <Link
            key={club.id}
            href={`/clubs/${club.id}`}
            className="card-hover group overflow-hidden"
          >
            {/* Banner */}
            <div className="h-24 bg-gradient-to-br from-primary/20 via-teal/10 to-background relative overflow-hidden">
              {club.banner_url && (
                <Image
                  src={club.banner_url}
                  alt={club.name}
                  fill
                  className="object-cover opacity-50 group-hover:opacity-70 transition-opacity"
                />
              )}
              {club.category && (
                <span className="absolute top-2 right-2 badge badge-primary text-[10px]">{club.category}</span>
              )}
            </div>

            <div className="p-4">
              {/* Logo + name */}
              <div className="flex items-center gap-3 -mt-8 mb-3">
                <div className="w-14 h-14 rounded-xl bg-surface border-2 border-border overflow-hidden flex items-center justify-center shrink-0">
                  {club.logo_url ? (
                    <Image src={club.logo_url} alt={club.name} width={56} height={56} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-teal/10 flex items-center justify-center">
                      <span className="text-primary font-bold text-lg">{club.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-text-primary text-base leading-tight">{club.name}</h3>

              {club.description && (
                <p className="text-text-muted text-xs mt-1 line-clamp-2">{club.description}</p>
              )}

              <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                {club.member_count !== undefined && (
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {club.member_count.toLocaleString()} members
                  </span>
                )}
                {club.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {club.location}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
