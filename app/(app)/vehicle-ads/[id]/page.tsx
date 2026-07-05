import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Car, MapPin, Gauge, Calendar, Disc, Shield, Mail, Phone, ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { VehicleAdWishlistButton } from '@/components/ui/VehicleAdWishlistButton'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: vehicle } = await supabase
    .from('vehicle_listings')
    .select('title, description')
    .eq('id', id)
    .maybeSingle()

  if (!vehicle) {
    return {
      title: 'Vehicle Not Found',
    }
  }

  return {
    title: `${vehicle.title} | Revoluzion Automotive`,
    description: vehicle.description || `Check out this premium vehicle on Revoluzion Automotive.`,
  }
}

export default async function VehicleDetailsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: vehicle } = await supabase
    .from('vehicle_listings')
    .select('*, users!fk_vehicle_listings_user_id_to_users(id, username, display_name, avatar_url, email)')
    .eq('id', id)
    .maybeSingle()

  if (!vehicle) {
    notFound()
  }

  const formattedPrice = `RM ${Math.floor(vehicle.price).toLocaleString('en-US')}`
  const formattedMileage = vehicle.mileage ? `${Math.floor(vehicle.mileage).toLocaleString('en-US')} km` : 'N/A'
  
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-border/40 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link 
              href="/vehicles" 
              className="text-text-muted hover:text-primary transition-colors flex items-center gap-1.5 uppercase font-black text-[10px] tracking-wider"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              <ArrowLeft size={14} /> Back
            </Link>
            <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">
              {vehicle.year || 'N/A'} {vehicle.make || 'Custom'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider font-orbitron mt-1" style={{ fontFamily: 'var(--font-orbitron)' }}>
            {vehicle.title}
          </h1>
          <div className="flex items-center gap-1.5 text-text-muted text-xs">
            <MapPin size={13} className="text-rose-500" />
            <span>{vehicle.location || 'Malaysia'}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1.5">Asking Price</div>
          <div className="text-2xl font-black text-primary font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
            {formattedPrice}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Cover Frame Slot */}
          <div className="relative aspect-[16/10] bg-surface rounded-2xl border border-slate-700/80 overflow-hidden shadow-2xl">
            {vehicle.image_url ? (
              <Image
                src={vehicle.image_url}
                alt={vehicle.title}
                fill
                priority
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-text-disabled/40">
                <Car size={64} className="animate-pulse" />
                <span className="text-xs uppercase font-bold tracking-widest mt-2">No Image Uploaded</span>
              </div>
            )}
            <VehicleAdWishlistButton vehicleId={vehicle.id} />
          </div>

          {/* Quick Specifications Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface border border-border/40 rounded-xl p-4.5 text-center space-y-1">
              <Calendar className="mx-auto text-primary shrink-0" size={20} />
              <div className="text-[9px] text-text-muted uppercase font-bold tracking-widest pt-1">Year</div>
              <div className="text-sm font-black text-white">{vehicle.year || 'N/A'}</div>
            </div>

            <div className="bg-surface border border-border/40 rounded-xl p-4.5 text-center space-y-1">
              <Gauge className="mx-auto text-teal-400 shrink-0" size={20} />
              <div className="text-[9px] text-text-muted uppercase font-bold tracking-widest pt-1">Odometer</div>
              <div className="text-sm font-black text-white">{formattedMileage}</div>
            </div>

            <div className="bg-surface border border-border/40 rounded-xl p-4.5 text-center space-y-1">
              <Disc className="mx-auto text-amber-500 shrink-0" size={20} />
              <div className="text-[9px] text-text-muted uppercase font-bold tracking-widest pt-1">Transmission</div>
              <div className="text-sm font-black text-white">{vehicle.transmission || 'Automatic'}</div>
            </div>

            <div className="bg-surface border border-border/40 rounded-xl p-4.5 text-center space-y-1">
              <Shield className="mx-auto text-rose-500 shrink-0" size={20} />
              <div className="text-[9px] text-text-muted uppercase font-bold tracking-widest pt-1">Manufacturer</div>
              <div className="text-sm font-black text-white uppercase">{vehicle.make || 'Other'}</div>
            </div>
          </div>

          {/* Build Details Description Panel */}
          <div className="bg-surface border border-border/40 rounded-2xl p-6 space-y-4">
            <h2 className="font-extrabold text-sm text-white uppercase tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>
              Listing Description & Upgrades
            </h2>
            <p className="text-text-secondary text-xs leading-relaxed whitespace-pre-wrap">
              {vehicle.description || 'The seller has not supplied a descriptive summary for this build catalog listing yet. Reach out below to request specifications!'}
            </p>
          </div>

        </div>

        {/* Sidebar Info Panel */}
        <div className="space-y-6">
          
          {/* Owner details card */}
          <div className="bg-surface border border-border/40 rounded-2xl p-6 space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h3 className="font-bold text-xs text-text-muted uppercase tracking-wider mb-3">Listed by Dealer / Owner</h3>
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                  {vehicle.users?.avatar_url ? (
                    <Image
                      src={vehicle.users.avatar_url}
                      alt={vehicle.users.username || 'User'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <DefaultAvatar />
                  )}
                </div>
                <div>
                  <div className="font-black text-sm text-white uppercase">{vehicle.users?.display_name || vehicle.users?.username || 'Revoluzion Enthusiast'}</div>
                  <div className="text-[10px] text-text-muted font-semibold">@{vehicle.users?.username || 'enthusiast'}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href={`/chat/dm/${vehicle.users?.id}`}
                className="w-full h-11 bg-primary text-black font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition-all"
                style={{ fontFamily: 'var(--font-orbitron)' }}
              >
                <Mail size={15} />
                Send Instant Chat Message
              </Link>

              {vehicle.users?.email && (
                <a
                  href={`mailto:${vehicle.users.email}?subject=Interested%20in%20your%20${encodeURIComponent(vehicle.title)}`}
                  className="w-full h-11 bg-surface-variant hover:bg-slate-800 border border-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all"
                  style={{ fontFamily: 'var(--font-orbitron)' }}
                >
                  <Phone size={15} className="text-teal-400" />
                  Email Seller directly
                </a>
              )}
            </div>
          </div>

          {/* Secure Transaction Tips */}
          <div className="bg-surface/50 border border-border/30 rounded-2xl p-5 space-y-3">
            <h4 className="font-bold text-xs text-primary uppercase tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>
              Deal Safely & Securely
            </h4>
            <ul className="space-y-2.5 text-[10px] text-text-secondary leading-normal">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1" />
                <span>Examine vehicle registers, chassis numbers, logbooks, and servicing records first.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1" />
                <span>Test run the engine and inspect mechanical and suspension works.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1" />
                <span>Complete ownership transfers through proper road department procedures.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  )
}
