import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { SafeImage } from '@/components/ui/SafeImage'
import { CalendarDays, MapPin, Clock, Eye, Heart, MessageSquare, Search, X } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'
import { CreateEventDialog } from '@/components/ui/CreateEventDialog'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { EventsOverviewMap } from '@/components/ui/EventsOverviewMap'
import { EventsSidebar } from '@/components/ui/EventsSidebar'

export const metadata: Metadata = {
  title: 'Events',
  description: 'Discover automotive events, car meets, and track days across Malaysia',
}

// Disable rough static caches for active events exploration page so that view stats rehydrate dynamically/directly on navigation!
export const dynamic = 'force-dynamic'

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; state?: string; q?: string }>
}) {
  const { category, state, q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select('*, users(username, display_name, avatar_url)')
    .gte('date', new Date().toISOString().slice(0, 10))
    .order('date', { ascending: true })
    .limit(100)

  // Fetch current user if available to allow displaying their own drafts
  const { data: { user } } = await supabase.auth.getUser()

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
  
  // Filter drafts privately: only show if draft status belongs to matching authenticated poster user
  const rawEventsTyped = (rawEvents ?? []).filter((event) => {
    if (event.status === 'draft') {
      return user && event.user_id === user.id
    }
    return true
  })

  // Apply card search query string if present
  const events = q && q.trim()
    ? rawEventsTyped.filter(ev =>
        ev.title.toLowerCase().includes(q.toLowerCase().trim()) ||
        (ev.description || '').toLowerCase().includes(q.toLowerCase().trim()) ||
        (ev.location || '').toLowerCase().includes(q.toLowerCase().trim())
      )
    : rawEventsTyped

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
        <EventsSidebar />

        {/* Right Side: Main Comprehensive Events Grid with bigger width and length */}
        <main className="flex-1 min-w-0">
          
          {/* Centered page-level search form for Events Directory cards */}
          <div className="flex justify-center w-full px-2 sm:px-4 mb-4">
            <form action="/events" method="GET" className="flex gap-2 relative group w-full max-w-2xl">
              {category && <input type="hidden" name="category" value={category} />}
              {state && <input type="hidden" name="state" value={state} />}
              <div className="relative flex-1">
                <input
                  type="text"
                  name="q"
                  defaultValue={q || ''}
                  placeholder="Search meets, tracks, or gather venue cards (Typo-safe)..."
                  className="w-full h-11 pl-11 pr-10 rounded-2xl bg-surface/50 border border-primary/40 focus:border-primary text-sm text-sm text-white placeholder-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary/25 transition-all shadow-lg"
                  style={{ fontFamily: 'var(--font-inter), sans-serif' }}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary group-focus-within:text-primary transition-colors" />
                
                {q && (
                  <a
                    href={`/events${category ? `?category=${category}` : ''}${state ? `${category ? '&' : '?'}state=${state}` : ''}`}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              <button
                type="submit"
                className="h-11 px-6 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/60 text-primary text-xs font-semibold tracking-wide transition-all shadow-md flex items-center gap-1.5 shrink-0"
                style={{ fontFamily: 'var(--font-orbitron)' }}
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
              </button>
            </form>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/20 border border-slate-900 rounded-xl px-4 py-3 mb-6">
            <span className="text-xs text-text-secondary">
              Viewing <strong className="text-primary font-mono">{events.length}</strong> upcoming automotive event sessions
            </span>
          </div>

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
                      <SafeImage
                        src={event.banner_url || "/cover-image/event-banner-image.jpeg"}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-103 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 400px"
                        fallbackSrc="/cover-image/event-banner-image.jpeg"
                        fallbackAlt="Car Meet Default Placeholder"
                      />

                      {/* Floating Category Badge inside banner */}
                      {event.category && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/85 border border-border/60 text-[9px] font-bold font-mono tracking-widest text-primary uppercase">
                          {event.category}
                        </span>
                      )}

                      {/* Floating Status Badge (Dynamic Upcoming, Ongoing with pulsation, Ended with red, or private Draft) */}
                      {(() => {
                        const statusStr = (event.status || 'upcoming').toLowerCase()
                        if (statusStr === 'draft') {
                          return (
                            <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-100 border border-slate-500/40 text-[9px] font-black tracking-wider uppercase leading-none shadow-md z-1">
                              Private Draft
                            </span>
                          )
                        } else if (statusStr === 'ongoing' || statusStr === 'on going' || statusStr === 'live') {
                          return (
                            <span 
                              className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[9px] font-black tracking-wider uppercase leading-none shadow-md z-1 flex items-center gap-1"
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
