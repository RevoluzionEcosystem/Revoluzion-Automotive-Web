import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarDays, MapPin, Users, ArrowLeft, Clock, DollarSign } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { SingleEventMap } from '@/components/ui/SingleEventMap'
import { EditEventDialog } from '@/components/ui/EditEventDialog'
import { EventViewIncrement } from '@/components/ui/EventViewIncrement'
import { EventLikeButton } from '@/components/ui/EventLikeButton'
import EventCommentSection from '@/components/ui/EventCommentSection'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('events').select('title, location, date').eq('id', id).single()
  if (!event) return { title: 'Event Not Found' }
  return {
    title: event.title,
    description: `${event.location} · ${event.date ? formatDate(event.date) : 'Date TBD'}`,
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
     .from('events')
     .select('*, users(username, display_name, avatar_url, is_verified)')
    .eq('id', id)
    .single()

  const profile = event.users

  // Check if session user matches event creator to enable edit/delete rights
  const { data: { session } } = await supabase.auth.getSession()
  const isCreator = session?.user?.id === event.user_id

  return (
    <div className="w-full mx-auto p-6 space-y-6">
      {/* Dynamic View analytics triggers */}
      <EventViewIncrement eventId={event.id} />

      <div className="flex items-center justify-between gap-4">
        <Link href="/events" className="inline-flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors text-sm">
          <ArrowLeft size={16} /> Back to Events
        </Link>
        <div className="flex items-center gap-2">
          <EventLikeButton eventId={event.id} initialLikes={event.likes_count || 0} />
          {isCreator && (
            <EditEventDialog event={event} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Banner/Image column taking 5 of 12 cols for a premium wide layout with reduced size/aspect ratio */}
        {event.banner_url ? (
          <div className="lg:col-span-4 w-full aspect-[4/3.2] rounded-2xl overflow-hidden border border-border relative bg-surface shadow-xl">
            <Image
              src={event.banner_url}
              alt={event.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 500px"
            />
          </div>
        ) : (
          <div className="lg:col-span-4 w-full aspect-[4/3.2] rounded-2xl border border-border overflow-hidden relative shadow-xl">
            <Image
              src="/cover-image/event-banner-image.jpeg"
              alt="Car Meet Default Placeholder"
              fill
              className="object-cover opacity-35"
              sizes="(max-width: 1024px) 100vw, 500px"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-linear-to-t from-[#0A0A0A] via-black/40 to-transparent">
              <CalendarDays size={48} className="text-primary-light mb-2.5 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
              <span className="text-text-primary text-[10px] sm:text-xs font-black uppercase tracking-widest text-center" style={{ fontFamily: 'var(--font-orbitron)' }}>
                No Banner Image Provided
              </span>
              <span className="text-text-muted text-[9px] font-semibold mt-1 tracking-wider text-center">
                Standard Community Meetup Placeholder
              </span>
            </div>
          </div>
        )}

        {/* Content & Info column taking remaining 8 of 12 cols */}
        <div className="lg:col-span-8 space-y-4">
          {/* Header Info */}
          <div className="border-b border-border/40 pb-3">
            <h1 className="text-3xl font-extrabold gradient-text mb-2.5" style={{ fontFamily: 'var(--font-orbitron)' }}>
              {event.title}
            </h1>

            {/* Organizer */}
            {profile && (
              <Link href={`/u/${profile.username}`} className="inline-flex items-center gap-2 hover:text-primary transition-colors text-xs font-medium text-text-secondary bg-linear-to-b from-[#181d29] to-[#0d1017] border-white/5 px-3 py-1 rounded-xl border">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt="" width={20} height={24} className="w-5 h-5 rounded-full object-cover shrink-0" />
                ) : (
                  <DefaultAvatar className="w-5 h-5 shrink-0" />
                )}
                Event created by <span className="text-text-primary hover:underline">{profile.display_name || profile.username}</span>
              </Link>
            )}
          </div>

          {/* Description Block */}
          <div className="card p-5 bg-linear-to-b from-[#181d29] to-[#0d1017] border-white/5 border-white/5 relative">
            <h2 className="font-bold text-xs uppercase tracking-widest text-text-primary mb-3" style={{ fontFamily: 'var(--font-orbitron)' }}>About this event</h2>
            <p className="text-text-secondary text-xs leading-relaxed whitespace-pre-line">
              {event.description || 'Welcome fellow drivers and car enthusiasts! Join us for this exciting automotive session. Expect beautiful sights, great fellowship, and clean builds. Meetup is free to attend unless noted in pricing guidelines. Stay tuned for potential updates!'}
            </p>
          </div>

          {/* Grid for parameters & location map inside content sidebar container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Meta attributes */}
            <div className="card p-5 bg-linear-to-b from-[#181d29] to-[#0d1017] border-white/5 flex flex-col justify-between gap-4">
              <div className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <CalendarDays size={16} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted font-black uppercase tracking-wider">Date</div>
                    <div className="text-text-primary text-[11px] font-bold">
                      {event.date ? formatDate(event.date, 'EEEE, dd MMMM yyyy') : 'TBD'}
                    </div>
                  </div>
                </div>

                {event.time && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Clock size={16} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-[10px] text-text-muted font-black uppercase tracking-wider">Time</div>
                      <div className="text-text-primary text-[11px] font-bold">{event.time}</div>
                    </div>
                  </div>
                )}

                {event.location && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-text-muted font-black uppercase tracking-wider">Location</div>
                      <div className="text-text-primary text-[11px] font-bold truncate" title={`${event.location}${event.state ? `, ${event.state}` : ''}`}>
                        {event.location}{event.state ? `, ${event.state}` : ''}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Users size={16} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted font-black uppercase tracking-wider">Attendees</div>
                    <div className="text-text-primary text-[11px] font-bold">{event.attendees || 0} RSVPs</div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted text-[11px] font-black uppercase">Admission</span>
                  <span className="text-primary font-extrabold text-base" style={{ fontFamily: 'var(--font-orbitron)' }}>
                    {event.price && typeof event.price === 'number' && event.price > 0 ? formatCurrency(event.price) : (event.price || 'Free')}
                  </span>
                </div>
                <button
                  className="btn-primary w-full py-2 rounded-xl text-xs font-bold leading-normal active:scale-98 transition-all"
                  style={{ fontFamily: 'var(--font-orbitron)', letterSpacing: '0.05em' }}
                >
                  {event.price && typeof event.price === 'number' && event.price > 0 ? 'Register Now' : 'RSVP Free'}
                </button>
              </div>

            </div>

            {/* Google Map Panel and link sharing */}
            <div className="card p-5 bg-linear-to-b from-[#181d29] to-[#0d1017] border-white/5 flex flex-col justify-between">
              <h3 className="font-bold text-[10px] uppercase tracking-widest text-text-secondary mb-2.5" style={{ fontFamily: 'var(--font-orbitron)' }}>Venue Map</h3>
              <div className="flex-1 min-h-36">
                <SingleEventMap 
                  latitude={event.latitude} 
                  longitude={event.longitude} 
                  locationName={event.location || ''} 
                  stateName={event.state} 
                />
              </div>
            </div>

          </div>

          {/* Discussion / Comments Section */}
          <div className="pt-2">
            <EventCommentSection eventId={event.id} />
          </div>

        </div>
      </div>
    </div>
  )
}
