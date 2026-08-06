import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { SafeImage } from '@/components/ui/SafeImage'
import { Car, Tag, MapPin, Gauge } from 'lucide-react'
import type { Metadata } from 'next'
import { VehicleAdSidebarWithSuspense } from '@/components/ui/VehicleAdSidebarWithSuspense'
import { VehicleAdSearchWithSuspense } from '@/components/ui/VehicleAdSearchWithSuspense'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { CreateVehicleAdDialog } from '@/components/ui/CreateVehicleAdDialog'
import { VehicleAdWishlistButton } from '@/components/ui/VehicleAdWishlistButton'

export const metadata: Metadata = {
  title: 'Vehicle Ads',
  description: 'Buy or sell premium cars, classic rides, track tools, and custom bikes on Revoluzion vehicles catalog',
}

export const dynamic = 'force-dynamic'

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ make?: string; status?: string; q?: string }>
}) {
  const { make, status, q } = await searchParams
  const supabase = await createClient()

  // 1. Fetch titles for instant client suggestion dropdown
  const { data: suggestions } = await supabase
    .from('vehicle_listings')
    .select('title')
    .eq('status', 'active')

  const allTitles = (suggestions ?? []).map(item => item.title)

  // 2. Query matching records
  let query = supabase
    .from('vehicle_listings')
    .select('*, users!fk_vehicle_listings_user_id_to_users(username, display_name, avatar_url)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(60)

  if (make && make !== 'All') {
    query = query.eq('make', make)
  }

  if (q) {
    const keywords = q.trim().split(/\s+/).filter(Boolean)
    if (keywords.length > 0) {
      const parts = keywords.map(kw => `title.ilike.%${kw}%`)
      query = query.or(parts.join(','))
    }
  }

  const { data: listings } = await query
  const typedListings = (listings ?? [])

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/40 gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
            Vehicle Ads
          </h1>
          <p className="text-text-muted text-sm mt-1">Acquire and trade sports performance models, custom project builds, and retro cruisers</p>
        </div>
        <CreateVehicleAdDialog />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side Filters Sidebar */}
        <VehicleAdSidebarWithSuspense />

        {/* Listings Fluid Elements Grid */}
        <div className="flex-1 space-y-6">
          <div className="flex justify-center w-full px-4 sm:px-6">
            <VehicleAdSearchWithSuspense allTitles={allTitles} />
          </div>

          {typedListings.length === 0 ? (
            <div className="text-center py-24 text-text-muted bg-surface/10 rounded-2xl border border-border/40">
              <Car size={48} className="mx-auto mb-4 opacity-20 text-primary" />
              <p className="text-lg font-semibold text-white">No vehicles found</p>
              <p className="text-sm mt-1">Try adapting makes categories, key parameters, or search terms in our filter side bar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {typedListings.map((vehicle) => {
                const formattedPrice = `RM ${Math.floor(vehicle.price).toLocaleString('en-US')}`
                const formattedMileage = vehicle.mileage ? `${Math.floor(vehicle.mileage).toLocaleString('en-US')} km` : 'N/A'

                return (
                  <Link 
                    key={vehicle.id} 
                    href={`/vehicle-ads/${vehicle.id}`} 
                    className="card-hover group overflow-hidden bg-gradient border border-slate-700/80 hover:border-slate-400 rounded-2xl flex flex-col justify-between text-xs transition-all duration-200 shadow-md"
                  >
                    <div>
                      {/* Image frame slot */}
                      <div className="p-2 pb-0">
                        <div className="relative aspect-[4/3] bg-surface-variant overflow-hidden rounded-xl border border-slate-700/60 group-hover:border-slate-500/50 transition-colors">
                          <SafeImage
                            src={vehicle.image_url || ''}
                            alt={vehicle.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          <VehicleAdWishlistButton vehicleId={vehicle.id} />
                        </div>
                      </div>

                      {/* Info section */}
                      <div className="p-4 space-y-3">
                        <div className="space-y-1">
                          <span className="text-[10px] text-primary/90 uppercase font-black tracking-widest bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                            {vehicle.year || 'N/A'} {vehicle.make || 'Custom'}
                          </span>
                          <h3 className="font-extrabold text-sm text-white line-clamp-1 group-hover:text-primary transition-colors uppercase pt-1 font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                            {vehicle.title}
                          </h3>
                        </div>

                        {/* Specs grid */}
                        <div className="grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-2 text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                          <div className="flex items-center gap-1">
                            <Gauge size={12} className="text-teal-400" />
                            <span>{formattedMileage}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin size={12} className="text-rose-400" />
                            <span className="truncate">{vehicle.location || 'Malaysia'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer banner */}
                    <div className="px-4 py-3 bg-slate-950/60 border-t border-slate-800/40 flex items-center justify-between gap-2 rounded-b-2xl">
                      <span className="font-black text-xs text-primary leading-none uppercase tracking-wide">
                        {formattedPrice}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
