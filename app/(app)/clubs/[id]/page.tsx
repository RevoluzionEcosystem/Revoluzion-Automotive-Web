import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { Users, MapPin, Calendar, ArrowLeft, Share2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Club — Revoluzion` }
}

export const revalidate = 600

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

// Demo club details
const DEMO_CLUBS: Club[] = [
  { id: '1', name: 'KL Modified Club', description: 'Kuala Lumpur\'s premier modified car community. Founded in 2015, we bring together passionate car modifiers from all over the Klang Valley. Our monthly meets attract over 200 attendees and feature workshops, competitions, and networking opportunities.', location: 'Kuala Lumpur', member_count: 342, category: 'Modified', created_at: '2015-06-01' },
  { id: '2', name: 'Malaysian JDM Owners', description: 'For lovers of Japanese domestic market vehicles. We celebrate the JDM culture with track days, photo shoots, and group drives.', location: 'Selangor', member_count: 891, category: 'JDM', created_at: '2012-03-15' },
  { id: '3', name: 'Penang Drift Alliance', description: 'Drift enthusiasts in the Pearl of the Orient. Regular practice sessions at Batu Kawan Circuit.', location: 'Penang', member_count: 127, category: 'Drift', created_at: '2018-09-01' },
  { id: '4', name: 'MY Classic Cars', description: 'Preserving Malaysia\'s automotive heritage. We restore and maintain classic vehicles while educating the next generation.', location: 'Nationwide', member_count: 204, category: 'Classic', created_at: '2010-01-01' },
  { id: '5', name: 'EV Malaysia', description: 'Electric vehicle owners and advocates. Join us as we drive the sustainable transportation revolution forward.', location: 'Nationwide', member_count: 418, category: 'EV', created_at: '2020-04-22' },
  { id: '6', name: 'Johor Track Days', description: 'Track day enthusiasts and time attack racers. Monthly track events at Johor Circuit.', location: 'Johor', member_count: 156, category: 'Track', created_at: '2017-11-01' },
]

export default async function ClubDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  let club: Club | null = null
  try {
    const { data } = await supabase.from('clubs').select('*').eq('id', id).single()
    club = data as Club | null
  } catch {
    club = null
  }

  // Fall back to demo data
  if (!club) {
    club = DEMO_CLUBS.find((c) => c.id === id) ?? null
  }

  if (!club) return notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link href="/clubs" className="inline-flex items-center gap-1 text-text-muted hover:text-text-secondary text-sm mb-4 transition-colors">
        <ArrowLeft size={14} /> Back to Clubs
      </Link>

      {/* Banner */}
      <div className="h-40 sm:h-52 rounded-xl bg-gradient-to-br from-primary/20 via-teal/10 to-background relative overflow-hidden mb-0 border border-border">
        {club.banner_url && (
          <Image src={club.banner_url} alt={club.name} fill className="object-cover opacity-60" />
        )}
      </div>

      {/* Header */}
      <div className="card p-5 -mt-px border-t-0 rounded-t-none rounded-b-xl mb-5">
        <div className="flex items-end gap-4 -mt-12 mb-4">
          <div className="w-20 h-20 rounded-xl bg-surface border-2 border-border overflow-hidden flex items-center justify-center shrink-0">
            {club.logo_url ? (
              <Image src={club.logo_url} alt={club.name} width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-teal/20 flex items-center justify-center">
                <span className="text-primary font-bold text-2xl">{club.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-8">
            <h1 className="text-xl font-bold gradient-text leading-tight" style={{ fontFamily: 'var(--font-orbitron)' }}>{club.name}</h1>
            {club.category && <span className="badge badge-primary text-xs mt-1">{club.category}</span>}
          </div>
          <button className="p-2 rounded-lg border border-border text-text-muted hover:text-text-secondary hover:border-border/70 transition-colors">
            <Share2 size={16} />
          </button>
        </div>

        {club.description && (
          <p className="text-text-secondary text-sm leading-relaxed mb-4">{club.description}</p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-text-muted">
          {club.member_count !== undefined && (
            <span className="flex items-center gap-1.5"><Users size={14} /> {club.member_count.toLocaleString()} members</span>
          )}
          {club.location && (
            <span className="flex items-center gap-1.5"><MapPin size={14} /> {club.location}</span>
          )}
          {club.created_at && (
            <span className="flex items-center gap-1.5"><Calendar size={14} /> Since {formatDate(club.created_at, 'MMMM yyyy')}</span>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-border">
          <button className="btn-primary w-full sm:w-auto px-8">Join Club</button>
        </div>
      </div>

      <div className="card p-5 text-center text-text-muted">
        <p className="text-sm">Club activity feed and member posts coming soon.</p>
      </div>
    </div>
  )
}
