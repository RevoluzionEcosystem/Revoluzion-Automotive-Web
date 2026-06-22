import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, MapPin, Users, Clock } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'
import { CreateEventDialog } from '@/components/ui/CreateEventDialog'

export const metadata: Metadata = {
  title: 'Events',
  description: 'Discover automotive events, car meets, and track days across Malaysia',
}

export const revalidate = 300 // ISR — revalidate every 5 minutes

const EVENT_CATEGORIES = ['All', 'Car Meet', 'Track Day', 'Show & Shine', 'Charity', 'Club Run', 'Workshop']

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
    query = query.eq('category', category)
  }
  if (state) {
    query = query.eq('state', state)
  }

  const { data: rawEvents } = await query
  const events = rawEvents ?? []

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>Events</h1>
          <p className="text-text-muted text-sm mt-1">Upcoming automotive events across Malaysia</p>
        </div>
        <CreateEventDialog />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {EVENT_CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/events?category=${cat}`}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              (category || 'All') === cat
                ? 'bg-primary text-black border-primary'
                : 'bg-surface text-text-secondary border-border hover:border-primary/50 hover:text-text-primary'
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <CalendarDays size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">No upcoming events</p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`} className="card-hover group overflow-hidden">
              {/* Banner */}
              <div className="aspect-video bg-surface-variant overflow-hidden">
                {event.banner_url ? (
                  <Image
                    src={event.banner_url}
                    alt={event.title}
                    width={400}
                    height={225}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-card">
                    <CalendarDays size={32} className="text-primary/40" />
                  </div>
                )}
              </div>

              <div className="p-4">
                {event.category && (
                  <span className="badge-primary text-xs mb-2 inline-flex">{event.category}</span>
                )}
                <h3 className="font-semibold text-text-primary mb-2 line-clamp-2">{event.title}</h3>

                <div className="space-y-1.5">
                  {event.date && (
                    <div className="flex items-center gap-2 text-text-muted text-xs">
                      <CalendarDays size={12} className="text-primary shrink-0" />
                      <span>{formatDate(event.date)}</span>
                      {event.time && <span className="text-text-disabled">· {event.time}</span>}
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2 text-text-muted text-xs">
                      <MapPin size={12} className="text-primary shrink-0" />
                      <span className="truncate">{event.location}{event.state ? `, ${event.state}` : ''}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-text-muted text-xs">
                      <Users size={12} />
                      <span>{event.attendees} attending</span>
                    </div>
                    <span className="text-primary text-sm font-semibold">
                      {event.price > 0 ? formatCurrency(event.price) : 'Free'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
