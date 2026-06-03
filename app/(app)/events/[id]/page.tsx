import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarDays, MapPin, Users, ArrowLeft, Clock, DollarSign } from 'lucide-react'
import { formatDate, formatCurrency, getInitials } from '@/lib/utils'
import type { Metadata } from 'next'

export const revalidate = 300

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
    .select('*, profiles(username, display_name, avatar_url, is_verified)')
    .eq('id', id)
    .single()

  if (!event) notFound()

  const profile = event.profiles

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link href="/events" className="inline-flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors text-sm mb-4">
        <ArrowLeft size={16} /> Back to Events
      </Link>

      {/* Banner */}
      {event.banner_url && (
        <div className="rounded-xl overflow-hidden mb-6 border border-border">
          <Image
            src={event.banner_url}
            alt={event.title}
            width={900}
            height={400}
            className="w-full object-cover max-h-80"
            priority
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Title & category */}
          <div>
            {event.category && <span className="badge-primary mb-3 inline-flex">{event.category}</span>}
            <h1 className="text-2xl font-bold gradient-text mb-2" style={{ fontFamily: 'var(--font-orbitron)' }}>{event.title}</h1>

            {/* Organizer */}
            {profile && (
              <Link href={`/u/${profile.username}`} className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt="" width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                    {getInitials(profile.display_name || profile.username || 'U')}
                  </div>
                )}
                Organized by <span className="text-text-primary">{profile.display_name || profile.username}</span>
              </Link>
            )}
          </div>

          {/* Description placeholder */}
          <div className="card p-4">
            <h2 className="font-semibold text-text-primary mb-2">About this event</h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              Join us for this exciting automotive event. More details to be announced. Stay tuned!
            </p>
          </div>
        </div>

        {/* Info card */}
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <CalendarDays size={18} className="text-primary" />
              </div>
              <div>
                <div className="text-text-muted text-xs">Date</div>
                <div className="text-text-primary text-sm font-medium">
                  {event.date ? formatDate(event.date, 'EEEE, dd MMMM yyyy') : 'TBD'}
                </div>
              </div>
            </div>

            {event.time && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Clock size={18} className="text-primary" />
                </div>
                <div>
                  <div className="text-text-muted text-xs">Time</div>
                  <div className="text-text-primary text-sm font-medium">{event.time}</div>
                </div>
              </div>
            )}

            {event.location && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <MapPin size={18} className="text-primary" />
                </div>
                <div>
                  <div className="text-text-muted text-xs">Location</div>
                  <div className="text-text-primary text-sm font-medium">
                    {event.location}{event.state ? `, ${event.state}` : ''}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Users size={18} className="text-primary" />
              </div>
              <div>
                <div className="text-text-muted text-xs">Attendees</div>
                <div className="text-text-primary text-sm font-medium">{event.attendees}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-text-muted text-sm">Entry fee</span>
                <span className="text-primary font-bold text-lg">
                  {event.price > 0 ? formatCurrency(event.price) : 'Free'}
                </span>
              </div>
              <button className="btn-primary w-full">
                {event.price > 0 ? 'Register Now' : 'RSVP Free'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
