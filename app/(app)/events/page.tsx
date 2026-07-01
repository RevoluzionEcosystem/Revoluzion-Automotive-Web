import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, MapPin, Users, Clock, ChevronRight, BadgeCheck, Eye, Heart, MessageSquare, Flag } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'
import { CreateEventDialog } from '@/components/ui/CreateEventDialog'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { EventsOverviewMap } from '@/components/ui/EventsOverviewMap'

export const metadata: Metadata = {
  title: 'Events',
  description: 'Discover automotive events, car meets, and track days across Malaysia',
}

// Disable rough static caches for active events exploration page so that view stats rehydrate dynamically/directly on navigation!
export const dynamic = 'force-dynamic'

const EVENT_CATEGORIES = ['All', 'Car Meet', 'Track Day', 'Show & Shine', 'Rally', 'Charity', 'Club Run', 'Workshop', 'Cruise', 'Other']
const STATE_FILTERS = ['All States', 'Selangor', 'Kuala Lumpur', 'Penang', 'Johor', 'Melaka', 'Perak', 'Sabah', 'Sarawak', 'Pahang']

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; state?: string }>
}) {
  const { category, state } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select('*, users(username, display_name, avatar_url)')
    .eq('status', 'upcoming')
    .order('date', { ascending: true })
    .limit(50)

  if (category && category !== 'All') {
    if (category === 'Car Meet') {
      query = query.in('category', ['Car Meet', 'Meet'])
    } else if (category === 'Track Day') {
      query = query.in('category', ['Track Day', 'Track'])
    } else if (category === 'Show & Shine') {
      query = query.in('category', ['Show & Shine', 'Show'])
    } else {
      query = query.eq('category', category)
    }
  }
  if (state && state !== 'All States') {
    query = query.eq('state', state)
  }

  const { data: rawEvents } = await query
  const events = rawEvents ?? []

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 space-y-6">
      
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>Explore Events</h1>
          <p className="text-text-muted text-sm mt-1">Upcoming track days, car meets, drift sessions, exhibitions, and club runs across Malaysia</p>
        </div>
        <CreateEventDialog />
      </div>

      {/* Live Map Overview Banner */}
      <EventsOverviewMap events={events} />

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side Submenu / Sidebar Filters */}
        <aside className="w-full lg:w-64 lg:shrink-0 space-y-6">
          
          {/* Section 1: Categories Submenu */}
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase text-primary tracking-widest block style-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
              EVENT SPEC
            </span>
            <div className="flex flex-col gap-0.5">
              {EVENT_CATEGORIES.map((cat) => {
                const isActive = (category || 'All') === cat
                const href = isActive ? '/events' : `/events?category=${cat}${state ? `&state=${state}` : ''}`
                
                return (
                  <Link
                    key={cat}
                    href={href}
                    className={`group flex items-center justify-between py-1 px-2.5 rounded-lg border transition-all text-left ${
                      isActive
                        ? 'bg-primary/5 border-primary/40 text-primary font-bold shadow-lg shadow-primary/5'
                        : 'bg-transparent border-transparent text-text-secondary hover:border-border/80 hover:bg-surface-variant/30 hover:text-white'
                    }`}
                  >
                    <span 
                      className="text-xs font-semibold" 
                      style={{ fontFamily: 'var(--font-inter), sans-serif' }}
                    >
                      {cat}
                    </span>
                    <ChevronRight
                      className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                        isActive ? 'opacity-100 translate-x-0.5 text-primary' : 'opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0'
                      }`}
                    />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Section 2: Regional States Submenu */}
          <div className="space-y-3 pt-2">
            <span className="text-[10px] font-black uppercase text-text-muted tracking-widest block style-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
              📍 BY REGION
            </span>
            <div className="flex flex-col gap-0.5">
              {STATE_FILTERS.map((st) => {
                const isActive = (state || 'All States') === st
                const href = isActive ? '/events' : `/events?state=${st}${category ? `&category=${category}` : ''}`
                
                return (
                  <Link
                    key={st}
                    href={href}
                    className={`group flex items-center justify-between py-1 px-2.5 rounded-lg border transition-all text-left ${
                      isActive
                        ? 'bg-primary/5 border-primary/40 text-primary font-bold shadow-lg shadow-primary/5'
                        : 'bg-transparent border-transparent text-text-secondary hover:border-border/80 hover:bg-surface-variant/30 hover:text-white'
                    }`}
                  >
                    <span 
                      className="text-xs font-semibold" 
                      style={{ fontFamily: 'var(--font-inter), sans-serif' }}
                    >
                      {st}
                    </span>
                    <ChevronRight
                      className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                        isActive ? 'opacity-100 translate-x-0.5 text-primary' : 'opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0'
                      }`}
                    />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Verified stamp footer */}
          <div className="bg-surface/80 border border-border/80 rounded-2xl p-4 space-y-2.5 hidden lg:block shadow-xl">
            <div className="flex items-center gap-1.5 text-primary text-xs font-bold leading-none style-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
              <BadgeCheck className="h-4 w-4 stroke-[2.5]" /> LIVE EVENTS DIRECTORY
            </div>
            <p className="text-[9.5px] text-text-muted leading-relaxed">
              These are 3rd party events hosted by independent organizers or users. Revoluzion is not liable for event safety, scheduling, or operations. Verify permits, legal status, and RSVP caps before driving to venues.
            </p>
          </div>

        </aside>

        {/* Right Side: Main Comprehensive Events Grid with bigger width and length */}
        <main className="flex-1 min-w-0">
          {events.length === 0 ? (
            <div className="text-center py-20 text-text-muted bg-surface/5 border border-border/60 rounded-2xl">
              <CalendarDays size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No results matches your searches</p>
              <p className="text-sm mt-1">Try resetting state filters or head back to <Link href="/events" className="text-primary hover:underline">All Events</Link>!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {events.map((event) => {
                const views = event.views || 0
                const likes = event.likes_count || 0
                const comments = event.comments_count || 0

                return (
                  <Link 
                    key={event.id} 
                    href={`/events/${event.id}`}
                    className="card bg-linear-to-b from-[#181d29] to-[#0d1017] hover:bg-[#151922]/40 border border-border/80 hover:border-primary/40 rounded-2xl overflow-hidden flex flex-col justify-between h-[360px] relative group cursor-pointer text-left transition-all duration-300"
                  >
                    
                    {/* Event Banner Image */}
                    <div className="relative w-full h-[200px] bg-surface-variant overflow-hidden border-b border-border/50 shrink-0">
                      {event.banner_url ? (
                        <Image
                          src={event.banner_url}
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-103 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 400px"
                        />
                      ) : (
                        <Image
                          src="/cover-image/event-banner-image.jpeg"
                          alt="Car Meet Default Placeholder"
                          fill
                          className="object-cover opacity-35"
                          sizes="(max-width: 768px) 100vw, 400px"
                        />
                      )}

                      {/* Floating Category Badge inside banner */}
                      {event.category && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/85 border border-border/60 text-[9px] font-bold font-mono tracking-widest text-primary uppercase">
                          {event.category}
                        </span>
                      )}

                      {/* Floating Status Badge (Dynamic Upcoming, Ongoing with pulsation, Ended with red) */}
                      {(() => {
                        const statusStr = (event.status || 'upcoming').toLowerCase()
                        if (statusStr === 'ongoing' || statusStr === 'on going' || statusStr === 'live') {
                          return (
                            <span 
                              className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[9px] font-black tracking-wider uppercase leading-none shadow-md z-1 animate-status-pulse flex items-center gap-1"
                              style={{ animation: 'status-pulse 2s infinite ease-in-out' }}
                            >
                              <span className="w-1 h-1 rounded-full bg-black animate-ping" />
                              On Going
                            </span>
                          )
                        } else if (statusStr === 'ended' || statusStr === 'past' || statusStr === 'closed') {
                          return (
                            <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black tracking-wider uppercase leading-none shadow-md z-1 opacity-80">
                              Ended
                            </span>
                          )
                        } else {
                          return (
                            <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-[#f1c40f] text-black text-[9px] font-black tracking-wider uppercase leading-none shadow-md z-1">
                              Upcoming
                            </span>
                          )
                        }
                      })()}
                    </div>

                    {/* Card details body with cohesive spacing */}
                    <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
                      
                      {/* Vertical Metadata Rows */}
                      <div className="space-y-2 min-w-0">
                        {/* Event Title joined with Inter Font */}
                        <h3 className="text-sm font-extrabold text-white leading-snug line-clamp-1 max-w-full group-hover:text-primary transition-colors duration-200" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
                          {event.title}
                        </h3>

                        {/* Organizer/Creator profile */}
                        {event.users && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {event.users.avatar_url ? (
                              <Image 
                                src={event.users.avatar_url} 
                                alt="" 
                                width={16} 
                                height={18} 
                                className="w-4 h-4 rounded-full object-cover border border-border/60 shrink-0" 
                              />
                            ) : (
                              <DefaultAvatar className="w-4 h-4 shrink-0" />
                            )}
                            <span className="text-[11px] text-text-secondary font-semibold truncate leading-none">
                              {event.users.display_name || event.users.username}
                            </span>
                          </div>
                        )}

                        <div className="space-y-1 pt-1.5 border-t border-border/20">
                          {/* Complete Date Line */}
                          <div className="flex items-center gap-1.5 text-text-muted text-[11px] font-medium">
                            <CalendarDays size={12} className="text-primary shrink-0" />
                            <span>{event.date ? formatDate(event.date, 'EEEE, dd MMMM yyyy') : 'TBD'}</span>
                          </div>

                          {/* Time detail parameter */}
                          {event.time && (
                            <div className="flex items-center gap-1.5 text-text-muted text-[11px] font-medium">
                              <Clock size={12} className="text-primary shrink-0" />
                              <span>{event.time} onwards</span>
                            </div>
                          )}

                          {/* Detail location parameter */}
                          {event.location && (
                            <div className="flex items-center gap-1.5 text-text-muted text-[11px] font-medium">
                              <MapPin size={12} className="text-primary shrink-0" />
                              <span className="truncate">{event.location}{event.state ? `, ${event.state}` : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Bottom: Date, attendees count, price fee */}
                      <div className="border-t border-border/30 pt-2 flex items-center justify-between text-[11px] text-text-muted font-bold font-mono">
                        <span className="flex items-center gap-1 shrink-0" title="Views">
                          <Eye size={12} className="text-text-muted" /> {views}
                        </span>
                        <span className="flex items-center gap-1 shrink-0" title="Likes">
                          <Heart size={12} className="text-primary fill-primary/30" /> {likes}
                        </span>
                        <span className="flex items-center gap-1 shrink-0" title="Comments">
                          <MessageSquare size={13} className="text-text-muted" /> {comments}
                        </span>
                        <span className="text-primary font-black scale-102" title="Price">
                          {event.price > 0 ? formatCurrency(event.price) : 'FREE'}
                        </span>
                      </div>

                    </div>

                  </Link>
                )
              })}
            </div>
          )}
        </main>

      </div>
      
    </div>
  )
}
