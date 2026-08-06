import { createClient } from '@/lib/supabase/server'
import { MapPin, Search, AlertCircle } from 'lucide-react'
import { SafeImage } from '@/components/ui/SafeImage'
import Link from 'next/link'
import { timeAgo } from '@/lib/utils'
import type { Metadata } from 'next'
import { ServicesSidebarWithSuspense } from '@/components/ui/ServicesSidebarWithSuspense'
import { ServicesOverviewMap } from '@/components/ui/ServicesOverviewMap'
import { CreateServiceDialog } from '@/components/ui/CreateServiceDialog'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'

export const metadata: Metadata = {
  title: 'Automotive Services Directory',
  description: 'Find trusted tuning workshops, nano-ceramic car washes, custom body spray painters, and mobile emergency mechanics across Malaysia.',
}

export const dynamic = 'force-dynamic'

interface UserProfile {
  username: string
  display_name: string | null
  avatar_url: string | null
  is_verified?: boolean
}

interface ServiceItem {
  id: string
  user_id: string
  title: string
  description: string | null
  price: number
  category: string
  location: string | null
  latitude: number | null
  longitude: number | null
  banner_url: string | null
  images_gallery: string[] | null
  status: string
  created_at: string
  updated_at: string
  users?: UserProfile | null
}

function wasEdited(s: ServiceItem): boolean {
  if (!s.updated_at) return false
  return Math.abs(new Date(s.updated_at).getTime() - new Date(s.created_at).getTime()) > 5000
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  const { category, q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('services')
    .select('*, users(username, display_name, avatar_url, is_verified)')
    .order('created_at', { ascending: false })

  // Fetch current user if available to allow displaying their own drafts
  const { data: { user } } = await supabase.auth.getUser()

  if (category && category !== 'All') {
    query = query.eq('category', category)
  }

  const { data: rawServices } = await query
  
  // Filter out draft status if it belongs to someone else
  const rawServicesTyped = ((rawServices ?? []) as unknown as ServiceItem[]).filter((service) => {
    if (service.status === 'draft') {
      return user && service.user_id === user.id
    }
    return true
  })

  // Run in-grid textual search if "q" search query parameter was passed
  const filteredServices = searchQueryFilter(rawServicesTyped, q)

  // Map markers array formatted for the google map
  const mapMarkers = filteredServices.map((s) => ({
    id: s.id,
    title: s.title,
    location: s.location,
    latitude: s.latitude,
    longitude: s.longitude,
    category: s.category,
    description: s.description
  }))

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>
            Automotive Services Hub
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Discover verified performance workshops, premium detaliers, spray booths & on-demand mobile support
          </p>
        </div>
        <CreateServiceDialog />
      </div>

      {/* Geospatial Map overview navigator panel */}
      <ServicesOverviewMap services={mapMarkers} />

      {/* Main split routing container */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Navigation column */}
        <ServicesSidebarWithSuspense />

        {/* Dynamic Services grid stream */}
        <main className="flex-1 min-w-0">
          
          {/* Custom typo-friendly centered loose Search Bar at top of services feed */}
          <div className="flex justify-center w-full px-2 sm:px-4 mb-4">
            <form action="/services" method="GET" className="flex gap-2 relative group w-full max-w-2xl">
              {category && <input type="hidden" name="category" value={category} />}
              <div className="relative flex-1">
                <input
                  type="text"
                  name="q"
                  defaultValue={q || ''}
                  placeholder="Search workshops, tires, mobile mechanics (Typo-safe)..."
                  className="w-full h-11 pl-11 pr-10 rounded-2xl bg-surface/50 border border-primary/40 focus:border-primary text-sm text-white placeholder-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary/25 transition-all shadow-lg"
                  style={{ fontFamily: 'var(--font-inter), sans-serif' }}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary group-focus-within:text-primary transition-colors" />
                
                {q && (
                  <a
                    href={`/services${category ? `?category=${category}` : ''}`}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white p-1"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
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

          {/* Header search info description */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/20 border border-slate-900 rounded-xl px-4 py-3 mb-6">
            <span className="text-xs text-text-secondary">
              Viewing <strong className="text-primary font-mono">{filteredServices.length}</strong> active service provider ads
            </span>
          </div>

          {filteredServices.length === 0 ? (
            <div className="text-center py-20 text-text-muted bg-surface/10 border border-slate-900 rounded-2xl">
              <AlertCircle size={40} className="mx-auto mb-3 text-primary/10 animate-slide-up" />
              <p className="font-semibold text-white uppercase text-xs tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>No Services Found</p>
              <p className="text-xs max-w-xs mx-auto leading-relaxed mt-1">
                There are no advertisements listed under these specific filters. Post a service ad with mock GPS to show up inside the map directory!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredServices.map((item) => {
                const isWorkshop = item.category === 'workshop'
                const isPaint = item.category === 'car_paint'
                
                const pillColor = isWorkshop ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : isPaint ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'

                const priceVal = Math.floor(item.price)

                // Navigation GPS targets
                const navQuery = item.location ? `${item.title}, ${item.location}` : item.title
                const coordString = `${item.latitude},${item.longitude}`
                const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordString)}`
                const wazeUrl = `https://waze.com/ul?ll=${item.latitude},${item.longitude}&q=${encodeURIComponent(navQuery)}&navigate=yes`

                // Fallback deterministic views / likes stats (similar to marketplace falls)
                const mockLikes = (item.title.length * 3 % 11) + 2
                const mockViews = (item.title.length * 7 % 43) + 12

                return (
                  <article 
                    key={item.id} 
                    className="card-hover group overflow-hidden bg-gradient border border-slate-700 hover:border-slate-400 rounded-xl flex flex-col justify-between text-xs transition-all duration-200 shadow-md"
                  >
                    <Link href={`/services/${item.id}`} className="block">
                      <div>
                        {/* Cover image banner */}
                        <div className="p-2 pb-0">
                          <div className="relative aspect-square w-full bg-surface-variant overflow-hidden rounded-lg border border-slate-700/60 group-hover:border-slate-500/50 transition-colors shrink-0">
                            <SafeImage 
                              src={item.banner_url || DEFAULT_IMAGES[item.category] || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80'}
                              alt={item.title} 
                              fill
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              fallbackSrc="/cover-image/halfcut-default.jpg"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/30 to-transparent" />
                            
                            {item.status === 'draft' && (
                              <div className="absolute top-2 left-2 z-10">
                                <span className="text-[8px] font-black uppercase tracking-widest border border-slate-500/40 bg-slate-700 text-slate-100 rounded px-1.5 py-0.5">
                                  Draft
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                          {/* Title block */}
                          <div className="space-y-1 text-left">
                            <h3 
                              className="text-white text-xs font-semibold line-clamp-1 group-hover:text-primary transition-colors"
                              style={{ fontFamily: 'var(--font-inter), sans-serif' }}
                            >
                              {item.title.replace(' [SeedMock]', '')}
                            </h3>

                            {/* Description body */}
                            <p 
                              className="text-[10.5px] text-text-secondary line-clamp-2 leading-relaxed select-none"
                              style={{ fontFamily: 'var(--font-inter), sans-serif' }}
                            >
                              {item.description || 'Verified member service provider. Reach out to inspect specs, match pricing, and check scheduling.'}
                            </p>
                          </div>

                          {/* Location, category & Price styled below description */}
                          <div className="space-y-1 pt-1.5 border-t border-slate-700/40">
                            <div className="flex items-center justify-between">
                              <span 
                                className="inline-block text-[8px] uppercase text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 tracking-wider font-semibold"
                                style={{ fontFamily: 'var(--font-inter), sans-serif' }}
                              >
                                {item.category.replace('_', ' ')}
                              </span>

                              {/* Price removed from card list view per user instruction */}
                            </div>

                            {item.location && (
                              <div className="flex items-center gap-1 text-text-muted text-[10px] pt-1">
                                <MapPin size={11} className="text-rose-500 shrink-0" />
                                <span className="truncate">{item.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>

                    <div>
                      <div className="px-3">
                        {/* Geospatial Directions Buttons */}
                        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800/60 mt-1">
                          <a 
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-7 rounded-md border border-slate-800 hover:border-slate-700 bg-surface/20 text-white font-mono text-[9px] font-black uppercase tracking-wider inline-flex items-center justify-center gap-1 transition-all active:scale-95"
                          >
                            Google Maps
                          </a>
                          <a 
                            href={wazeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-7 rounded-md bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-800/40 text-primary font-mono text-[9px] font-black uppercase tracking-wider inline-flex items-center justify-center gap-1 transition-all active:scale-95"
                          >
                            Waze Nav
                          </a>
                        </div>
                      </div>

                      {/* Metadata Footer: Views, Likes, Creator Info */}
                      <div className="px-3 pb-3 pt-2.5 border-t border-slate-800/80 bg-surface/10 rounded-b-xl mt-2.5">
                        <div className="flex items-center justify-between text-[10px] text-text-secondary">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {item.users?.avatar_url ? (
                              <div className="relative w-4 h-4 rounded-full overflow-hidden border border-slate-700 bg-surface flex-shrink-0">
                                <img src={item.users.avatar_url} className="object-cover w-full h-full" alt="" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 border border-slate-700 rounded-full flex items-center justify-center bg-surface overflow-hidden flex-shrink-0">
                                <DefaultAvatar className="w-3.5 h-3.5 text-primary" />
                              </div>
                            )}
                            <span className="text-[10px] text-text-muted truncate max-w-16">
                              {item.users?.username || item.users?.display_name || 'Owner'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                          <span className="flex items-center gap-0.5">
                            <span className="text-rose-400">♥</span>
                            {mockLikes}
                          </span>
                          <span className="text-[10px] text-text-muted">|</span>
                          <span>
                            {mockViews} views
                          </span>
                          {wasEdited(item) && (
                            <>
                              <span className="text-[10px] text-text-muted">|</span>
                              <span className="text-primary-light font-bold" title="Edited Listing ad">
                                (ed)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
                )
              })}
            </div>
          )}
        </main>
      </div>

    </div>
  )
}

function searchQueryFilter(items: ServiceItem[], queryStr?: string): ServiceItem[] {
  if (!queryStr || !queryStr.trim()) return items
  const q_clean = queryStr.toLowerCase().trim()
  return items.filter((x) => (
    x.title.toLowerCase().includes(q_clean) ||
    (x.description || '').toLowerCase().includes(q_clean) ||
    (x.location || '').toLowerCase().includes(q_clean)
  ))
}

const DEFAULT_IMAGES: Record<string, string> = {
  workshop: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
  car_wash: 'https://images.unsplash.com/photo-1607860108855-64cac2078bd9?auto=format&fit=crop&w=400&q=80',
  car_paint: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=400&q=80',
  freelance_work: 'https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?auto=format&fit=crop&w=400&q=80'
}
