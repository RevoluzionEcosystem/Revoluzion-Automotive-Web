import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, Tag, Phone, MessageCircle } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { InlineCommentSection } from '@/components/ui/InlineCommentSection'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('services').select('title, price').eq('id', id).single()
  if (!data) return { title: 'Service Not Found' }
  return {
    title: `${data.title} — Automotive Services Directory`,
    description: `RM ${data.price} — Find trusted automotive services on Revoluzion!`,
  }
}

export default async function ServiceDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: service } = await supabase
    .from('services')
    .select('*, users(id, username, display_name, avatar_url, is_verified, phone)')
    .eq('id', id)
    .single()

  if (!service) notFound()

  const profile = service.users ? (Array.isArray(service.users) ? service.users[0] : service.users) : null

  // GPS targets
  const navQuery = service.location ? `${service.title}, ${service.location}` : service.title
  const coordString = `${service.latitude},${service.longitude}`
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordString)}`
  const wazeUrl = `https://waze.com/ul?ll=${service.latitude},${service.longitude}&q=${encodeURIComponent(navQuery)}&navigate=yes`

  // WhatsApp connection formatting
  const phoneRaw = profile?.phone || '60123456789'
  const waPhone = phoneRaw.replace(/[^0-9]/g, '')
  const waUrl = `https://wa.me/${waPhone.startsWith('60') || waPhone.startsWith('1') ? waPhone : '6' + waPhone}?text=Hi,%20I'm%20interested%20in%20your%20directory%20service:%20"${encodeURIComponent(service.title)}"%20on%20Revoluzion!`

  // Random views/likes stats generator
  const totalLikes = (service.title.length * 3 % 11) + 2
  const totalViews = (service.title.length * 7 % 43) + 12

  const DEFAULT_IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80'

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
      
      {/* Back button */}
      <div>
        <Link href="/services" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors font-semibold uppercase tracking-wider font-mono">
          <ArrowLeft size={14} /> Back to Directory
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Banner Column - 1fr */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl overflow-hidden border border-border aspect-square bg-[#0c0e14] relative">
            <Image
              src={service.banner_url || DEFAULT_IMAGE_FALLBACK}
              alt={service.title}
              fill
              className="w-full h-full object-cover"
              priority
            />
          </div>

          {/* Quick Metrics display */}
          <div className="flex items-center justify-between p-3.5 bg-gradient border border-slate-700/60 rounded-xl text-xs text-text-secondary">
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="text-rose-400 font-bold">♥</span> {totalLikes} bookmarks
            </span>
            <span className="text-slate-700">|</span>
            <span className="font-semibold">{totalViews} views to date</span>
          </div>

          {/* Navigation panel */}
          <div className="bg-surface/20 border border-slate-800 p-4 rounded-xl space-y-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">Service Navigation</h3>
            <div className="grid grid-cols-2 gap-2">
              <a 
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 rounded-lg border border-slate-800 hover:border-slate-700 bg-surface/20 text-white font-mono text-[10px] font-black uppercase tracking-wider inline-flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                Google Maps
              </a>
              <a 
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 rounded-lg bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-800/40 text-primary font-mono text-[10px] font-black uppercase tracking-wider inline-flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                Waze Nav
              </a>
            </div>
          </div>
        </div>

        {/* Info detail Column - 2fr */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-block text-[9px] uppercase text-primary bg-primary/10 border border-primary/20 rounded px-2 py-0.5 tracking-wider font-bold">
                {service.category?.replace('_', ' ')}
              </span>
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-1 font-mono uppercase tracking-wide">
              {service.title}
            </h1>
            
            {/* Show starting / base PRICE here on individual page only */}
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">
              RM {Math.floor(service.price).toLocaleString('en-US')}
              <span className="text-xs text-text-muted font-normal uppercase tracking-wider block mt-1 font-sans">Starting / Base Price</span>
            </div>
          </div>

          {service.description && (
            <div className="bg-surface/20 border border-slate-805 p-5 rounded-xl border-white/5 bg-linear-to-b from-[#181d29] to-[#0d1017]">
              <h2 className="font-bold text-white mb-3 text-xs uppercase tracking-wider font-mono">About Service & Offerings</h2>
              <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap select-text">{service.description}</p>
            </div>
          )}

          {service.location && (
            <div className="flex items-center gap-2 text-text-muted text-sm font-semibold">
              <MapPin size={15} className="text-[#06B6D4]" />
              <span>{service.location}</span>
            </div>
          )}

          {/* Seller / Workshop Provider Card */}
          {profile && (
            <div className="card p-4 bg-gradient border border-slate-700/80 rounded-xl space-y-4 max-w-xl">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold font-mono">Verified Service Provider</span>
                <span className="bg-primary/10 border border-primary/20 text-primary text-[8px] font-black uppercase px-1.5 py-0.5 rounded">DIRECTOR</span>
              </div>

              <Link href={`/u/${profile.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                {profile.avatar_url ? (
                  <div className="relative w-11 h-11 rounded-full overflow-hidden border border-slate-700">
                    <Image src={profile.avatar_url} alt="" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-11 h-11 border border-slate-700 rounded-full flex items-center justify-center bg-surface overflow-hidden">
                    <DefaultAvatar className="w-9 h-9" />
                  </div>
                )}
                <div>
                  <div className="font-medium text-text-primary text-sm flex items-center gap-1.5">
                    {profile.display_name || profile.username}
                    {profile.is_verified && <span className="bg-primary/10 border border-primary/20 text-primary text-[8px] font-black uppercase px-1.5 py-0.5 rounded">PRO</span>}
                  </div>
                  <div className="text-text-muted text-xs">@{profile.username}</div>
                </div>
              </Link>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3.5 max-w-xl">
            {user?.id === profile?.id ? (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 h-11 bg-slate-800 border border-slate-700 text-slate-500 text-xs uppercase tracking-wider font-bold rounded-xl cursor-not-allowed font-mono"
              >
                Your own service
              </button>
            ) : (
              <Link
                href={`/chat/dm/${profile?.id || ''}?preset=${encodeURIComponent(`Hi there! I'm interested in your directory service listing: "${service.title}" on Revoluzion!`)}`}
                className="w-full flex items-center justify-center gap-2 h-11 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs uppercase tracking-wider font-bold rounded-xl transition-all duration-200 font-mono"
              >
                <MessageCircle size={15} /> Book Consultation
              </Link>
            )}

            {user?.id === profile?.id ? (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 h-11 bg-slate-800 border border-slate-700 text-slate-500 text-xs uppercase tracking-wider font-bold rounded-xl cursor-not-allowed font-mono"
              >
                Your own service
              </button>
            ) : (
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 h-11 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs uppercase tracking-wider font-bold rounded-xl transition-all duration-200 font-mono"
              >
                <Phone size={15} /> Contact WhatsApp
              </a>
            )}
          </div>

          <p className="text-text-disabled text-xs font-mono">Listed {timeAgo(service.created_at)}</p>
          
          {/* Threaded comments for this directory service listing */}
          <div className="pt-6 border-t border-border mt-10 max-w-xl">
            <h3 className="font-bold text-white mb-4 text-xs uppercase tracking-wider font-mono">Discussion & Reviews</h3>
            <InlineCommentSection itemId={service.id} feedType="service" currentUserId={user?.id ?? null} />
          </div>
        </div>
      </div>

    </div>
  )
}