'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  ShoppingBag, Heart, Eye, Star, Plus, Phone,
  MessageCircle, Trash2, Edit3, ShieldAlert, X,
  Car, Wrench, Layers, Tag, MapPin, Calendar, Gauge, Disc
} from 'lucide-react'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { CreateListingModal } from '@/components/ui/CreateListingModal'
import { EditListingModal } from '@/components/ui/EditListingModal'
import { CreateVehicleAdDialog } from '@/components/ui/CreateVehicleAdDialog'
import { CreateServiceDialog } from '@/components/ui/CreateServiceDialog'
import { EditServiceDialog } from '@/components/ui/EditServiceDialog'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface DashboardProps {
  user: any
  activeCount: number
  soldCount: number
  ratingStars: number
  ratingsCount: number
  totalViews: number
  totalLikes: number
  userListings: any[]
  userVehicles: any[]
  userServices: any[]
  userHalfcuts: any[]
  wishlistProductsCount: number
  wishlistedProducts: any[]
  wishlistedMarketplaces: any[]
  sellerReviews: any[]
}

type TabType = 'parts' | 'vehicles' | 'services' | 'halfcuts'

export function DashboardClient({
  user,
  activeCount,
  soldCount,
  ratingStars,
  ratingsCount,
  totalViews,
  totalLikes,
  userListings,
  userVehicles,
  userServices,
  userHalfcuts,
  wishlistProductsCount,
  wishlistedProducts,
  wishlistedMarketplaces,
  sellerReviews,
}: DashboardProps) {
  const supabase = createClient()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('parts')

  // Lists states
  const [listings, setListings] = useState<any[]>(userListings)
  const [vehicles, setVehicles] = useState<any[]>(userVehicles)
  const [services, setServices] = useState<any[]>(userServices)
  const [halfcuts, setHalfcuts] = useState<any[]>(userHalfcuts)

  // Modal / popup states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingListing, setEditingListing] = useState<any | null>(null)
  const [editingService, setEditingService] = useState<any | null>(null)
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null)

  // Wishlist and Reviews expand states
  const [showAllWishlists, setShowAllWishlists] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)

  const hasMoreWishlists = wishlistProductsCount > 5
  const hasMoreReviews = sellerReviews.length > 5

  const displayedProducts = wishlistedProducts.slice(0, 3)
  const remainingSlots = 5 - displayedProducts.length
  const displayedMarketplaces = wishlistedMarketplaces.slice(0, Math.max(0, remainingSlots))
  const displayedReviews = sellerReviews.slice(0, 5)

  // Handle deletions of parts
  const handleDeleteListing = async (id: string) => {
    const confirm = window.confirm('Are you holding complete deletion matches on this part listing?')
    if (!confirm) return

    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Listing deleted')
      setListings((prev) => prev.filter((item) => item.id !== id))
    } catch (err: any) {
      toast.error('Failed deletion', { description: err.message })
    }
  }

  // Handle deletions of classified vehicle ads
  const handleDeleteVehicle = async (id: string, title: string) => {
    const confirm = window.confirm(`Are you absolutely sure you want to permanently delete vehicle ad "${title}"?`)
    if (!confirm) return

    try {
      const { error } = await supabase
        .from('vehicle_listings')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Vehicle Ad deleted')
      setVehicles((prev) => prev.filter((item) => item.id !== id))
      router.refresh()
    } catch (err: any) {
      toast.error('Failed deletion', { description: err.message })
    }
  }

  // Handle deletions of business services
  const handleDeleteService = async (id: string, title: string) => {
    const confirm = window.confirm(`Are you sure you want to permanently delete service ad "${title}"?`)
    if (!confirm) return

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Service deleted')
      setServices((prev) => prev.filter((item) => item.id !== id))
      router.refresh()
    } catch (err: any) {
      toast.error('Failed deletion', { description: err.message })
    }
  }

  // Handle deletions of halfcuts donor builds
  const handleDeleteHalfcut = async (id: string, title: string) => {
    const confirm = window.confirm(`Are you sure you want to delete halfcut bundle "${title}"?`)
    if (!confirm) return

    try {
      const { error } = await supabase
        .from('halfcuts')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Halfcut bundle deleted')
      setHalfcuts((prev) => prev.filter((item) => item.id !== id))
      router.refresh()
    } catch (err: any) {
      toast.error('Failed deletion', { description: err.message })
    }
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 text-xs">
      
      {/* Upper Title and Subtitles heading bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/5 gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white uppercase tracking-wider font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
            My Ads Dashboard
          </h1>
          <p className="text-text-secondary text-xs">Track visitor listings stats, reviews feeds, handle wishlisted peer offers, and manage published ads categories</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {activeTab === 'parts' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="h-10 px-5 bg-primary text-black font-black uppercase tracking-wider rounded-xl transition-all duration-200 hover:opacity-90 active:scale-98 flex items-center justify-center gap-1.5"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              <Plus size={16} /> Post Part/Accessory
            </button>
          )}

          {activeTab === 'vehicles' && (
            <CreateVehicleAdDialog />
          )}

          {activeTab === 'services' && (
            <CreateServiceDialog />
          )}

          {activeTab === 'halfcuts' && (
            <Link
              href="/halfcuts/post"
              className="h-10 px-5 bg-primary text-black font-black uppercase tracking-wider rounded-xl transition-all duration-200 hover:opacity-90 active:scale-98 flex items-center justify-center gap-1.5"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              <Plus size={16} /> Post Halfcut Set
            </Link>
          )}
        </div>
      </div>

      {/* Primary analytical status counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient border border-white/5 rounded-xl flex flex-col justify-between">
          <span className="text-text-muted text-[10px] font-black uppercase tracking-wider font-orbitron">Active Listings</span>
          <span className="text-2xl font-black text-primary mt-2">{activeCount}</span>
        </div>
        <div className="p-4 bg-gradient border border-white/5 rounded-xl flex flex-col justify-between">
          <span className="text-text-muted text-[10px] font-black uppercase tracking-wider font-orbitron">Sold Completed</span>
          <span className="text-2xl font-black text-emerald-400 mt-2">{soldCount}</span>
        </div>
        <div className="p-4 bg-gradient border border-white/5 rounded-xl flex flex-col justify-between">
          <span className="text-text-muted text-[10px] font-black uppercase tracking-wider font-orbitron">Seller stars</span>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-2xl font-black text-amber-400">{ratingStars}</span>
            <div className="flex items-center text-amber-500">
              <Star size={14} className="fill-current" />
            </div>
            <span className="text-text-muted text-[10px]">({ratingsCount} reviews)</span>
          </div>
        </div>
        <div className="p-4 bg-gradient border border-white/5 rounded-xl flex flex-col justify-between">
          <span className="text-text-muted text-[10px] font-black uppercase tracking-wider font-orbitron">Analytics Traffic</span>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-text-secondary flex items-center gap-1"><Eye size={12} className="text-[#8A90A0]" /> {totalViews}</span>
            <span className="text-xs text-text-secondary flex items-center gap-1"><Heart size={12} className="text-rose-400 fill-current" /> {totalLikes}</span>
          </div>
        </div>
      </div>

      {/* Tab select option blocks */}
      <div className="flex border-b border-white/5 gap-2 overflow-x-auto scrollbar-none pb-0.5">
        <button
          onClick={() => setActiveTab('parts')}
          className={`px-5 py-3 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'parts' ? 'text-primary border-primary' : 'text-text-muted border-transparent hover:text-white'
          }`}
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          📦 Parts & Accessories ({listings.length})
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`px-5 py-3 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'vehicles' ? 'text-primary border-primary' : 'text-text-muted border-transparent hover:text-white'
          }`}
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          🚗 Vehicle Ads ({vehicles.length})
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`px-5 py-3 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'services' ? 'text-primary border-primary' : 'text-text-muted border-transparent hover:text-white'
          }`}
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          🔧 Services ({services.length})
        </button>
        <button
          onClick={() => setActiveTab('halfcuts')}
          className={`px-5 py-3 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'halfcuts' ? 'text-primary border-primary' : 'text-text-muted border-transparent hover:text-white'
          }`}
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          🚗💨 Halfcut Bundles ({halfcuts.length})
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Selected listings list */}
        <div className="lg:col-span-2 space-y-6">

          {/* TAB 1: PARTS & ACCESSORIES */}
          {activeTab === 'parts' && (
            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#8A90A0] pb-2 border-b border-white/5 font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                Parts & Spares Listings
              </h2>
              {listings.length === 0 ? (
                <div className="text-center py-16 bg-surface/20 border border-white/5 rounded-xl space-y-3">
                  <p className="text-text-secondary text-sm">You haven't listed any components or aftermarket accessories yet.</p>
                  <button onClick={() => setShowCreateModal(true)} className="btn-primary text-xs uppercase font-bold tracking-wider">
                    Post My First Part Ad
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {listings.map((item) => {
                    const images = (item.marketplace_images as any[])?.sort((a,b) => a.sort_order - b.sort_order)
                    const mainImage = images?.[0]?.image_url
                    const priceVal = Math.floor(item.price)

                    return (
                      <div key={item.id} className="bg-gradient border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center transition-all duration-200 hover:border-slate-700">
                        <div className="flex gap-3 items-center min-w-0">
                          <div className="relative w-14 h-14 bg-surface-variant rounded-lg overflow-hidden border border-white/5 flex-shrink-0">
                            {mainImage ? (
                              <Image src={mainImage} fill className="object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-primary/30">
                                <ShoppingBag size={20} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-white font-bold truncate text-sm" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>{item.title}</h4>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="inline-block text-[8px] font-black uppercase px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded text-primary tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>
                                {item.condition || 'Good'}
                              </span>
                              <span className="text-text-muted text-[11px]">{item.location || 'Malaysia'}</span>
                              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                                item.status === 'active'
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : item.status === 'sold'
                                    ? 'bg-red-500/10 border-red-500/20 text-rose-400'
                                    : 'bg-slate-700/35 border-slate-600 text-text-muted'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-slate-900 sm:border-0 pt-3 sm:pt-0">
                          <span className="text-emerald-400 text-sm font-extrabold tracking-wider font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                            RM {priceVal.toLocaleString('en-US')}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingListing(item)}
                              className="p-1.5 rounded-lg border border-slate-800 bg-surface text-text-secondary hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
                              title="Edit listing details"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteListing(item.id)}
                              className="p-1.5 rounded-lg border border-red-950 bg-red-950/15 text-rose-400 hover:text-white hover:bg-rose-500 hover:border-rose-500 transition-all cursor-pointer"
                              title="Delete listing"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VEHICLE CLASSIFIED ADS */}
          {activeTab === 'vehicles' && (
            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#8A90A0] pb-2 border-b border-white/5 font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                Automobile & Superbike Classifieds
              </h2>
              {vehicles.length === 0 ? (
                <div className="text-center py-16 bg-surface/20 border border-white/5 rounded-xl space-y-3">
                  <p className="text-text-secondary text-sm">You haven't registered any vehicle advertisement ads yet.</p>
                  <p className="text-text-muted text-[10px]">Put up your classic ride or custom project build for collectors directly.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicles.map((car) => {
                    const priceVal = Math.floor(car.price)

                    return (
                      <div key={car.id} className="bg-gradient border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center transition-all duration-200 hover:border-slate-700">
                        <div className="flex gap-3 items-center min-w-0">
                          <div className="relative w-14 h-14 bg-surface-variant rounded-lg overflow-hidden border border-white/5 flex-shrink-0">
                            {car.image_url ? (
                              <Image src={car.image_url} fill className="object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-primary/30">
                                <Car size={20} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-white font-bold truncate text-sm" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>{car.title}</h4>
                            <div className="flex items-center gap-x-3 gap-y-1 mt-1 flex-wrap text-[10px] text-text-muted font-medium">
                              <span className="flex items-center gap-0.5 text-primary">
                                <Calendar size={11} /> {car.year || 'N/A'}
                              </span>
                              <span className="flex items-center gap-0.5 text-teal-400">
                                <Gauge size={11} /> {car.mileage ? `${Math.floor(car.mileage).toLocaleString('en-US')} km` : 'N/A'}
                              </span>
                              <span className="flex items-center gap-0.5 text-amber-500">
                                <Disc size={11} /> {car.transmission || 'Automatic'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-slate-900 sm:border-0 pt-3 sm:pt-0">
                          <span className="text-emerald-400 text-sm font-extrabold tracking-wider font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                            RM {priceVal.toLocaleString('en-US')}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/vehicle-ads/${car.id}`}
                              className="p-1.5 rounded-lg border border-slate-800 bg-surface text-text-secondary hover:text-white hover:border-slate-500 transition-colors"
                              title="View listing page"
                            >
                              <Eye size={13} />
                            </Link>
                            <button
                              onClick={() => handleDeleteVehicle(car.id, car.title)}
                              className="p-1.5 rounded-lg border border-red-950 bg-red-950/15 text-rose-400 hover:text-white hover:bg-rose-500 hover:border-rose-500 transition-all cursor-pointer"
                              title="Delete classified ad"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SERVICES */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#8A90A0] pb-2 border-b border-white/5 font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                Professional Automotive & Workshop Services
              </h2>
              {services.length === 0 ? (
                <div className="text-center py-16 bg-surface/20 border border-white/5 rounded-xl space-y-3">
                  <p className="text-text-secondary text-sm">No workshop repair, detailing, or dyno tuning services listed yet.</p>
                  <p className="text-text-muted text-[10px]">Promote your customized local business with visual maps.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {services.map((svc) => (
                    <div key={svc.id} className="bg-gradient border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center transition-all duration-200 hover:border-slate-700">
                      <div className="flex gap-3 items-center min-w-0">
                        <div className="relative w-14 h-14 bg-surface-variant rounded-lg overflow-hidden border border-white/5 flex-shrink-0">
                          {svc.banner_url ? (
                            <Image src={svc.banner_url} fill className="object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary/30">
                              <Wrench size={20} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-white font-bold truncate text-sm" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>{svc.title}</h4>
                          <p className="text-text-muted text-[10px] mt-0.5 line-clamp-1">{svc.category || 'Workshop Care'}</p>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-text-secondary font-medium">
                            <MapPin size={11} className="text-rose-500" />
                            <span>{svc.location || 'Malaysia'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-slate-900 sm:border-0 pt-3 sm:pt-0">
                        <span className="text-emerald-400 text-sm font-extrabold tracking-wider font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                          {svc.price && svc.price > 0 ? `RM ${Math.floor(svc.price).toLocaleString('en-US')}` : 'Request Quote'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingService(svc)}
                            className="p-1.5 rounded-lg border border-slate-800 bg-surface text-text-secondary hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
                            title="Edit workshop ad"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteService(svc.id, svc.title)}
                            className="p-1.5 rounded-lg border border-red-950 bg-red-950/15 text-rose-400 hover:text-white hover:bg-rose-500 hover:border-rose-500 transition-all cursor-pointer"
                            title="Delete service ad"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HALFCUTS */}
          {activeTab === 'halfcuts' && (
            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#8A90A0] pb-2 border-b border-white/5 font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                Halfcut donor stripping sheets
              </h2>
              {halfcuts.length === 0 ? (
                <div className="text-center py-16 bg-surface/20 border border-white/5 rounded-xl space-y-3">
                  <p className="text-text-secondary text-sm">No halfcut engines or donor car stripping lists uploaded yet.</p>
                  <Link href="/halfcuts/post" className="btn-primary inline-flex text-[10px] uppercase py-1.5 px-4 rounded-lg">
                    Add My First Halfcut
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {halfcuts.map((hc) => {
                    const partsList = hc.halfcut_items || []

                    return (
                      <div key={hc.id} className="bg-gradient border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center transition-all duration-200 hover:border-slate-700">
                        <div className="flex gap-3 items-center min-w-0">
                          <div className="p-3 rounded-lg bg-surface border border-slate-800 text-primary self-start shrink-0">
                            <Layers size={18} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-white font-bold truncate text-sm" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>{hc.title}</h4>
                            <p className="text-[10px] text-text-muted mt-0.5 font-bold uppercase tracking-wider">{partsList.length} sub-components sheets cataloged</p>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-text-secondary font-medium">
                              <MapPin size={11} className="text-rose-500" />
                              <span>{hc.location || 'Malaysia'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-slate-900 sm:border-0 pt-3 sm:pt-0">
                          <span className="text-text-secondary text-xs font-semibold">
                            {hc.contact || 'No contact'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/halfcuts/edit/${hc.id}`}
                              className="p-1.5 rounded-lg border border-slate-800 bg-surface text-text-secondary hover:text-white hover:border-slate-500 transition-colors"
                              title="Edit spares sheet"
                            >
                              <Edit3 size={13} />
                            </Link>
                            <button
                              onClick={() => handleDeleteHalfcut(hc.id, hc.title)}
                              className="p-1.5 rounded-lg border border-red-950 bg-red-950/15 text-rose-400 hover:text-white hover:bg-rose-500 hover:border-rose-500 transition-all cursor-pointer"
                              title="Delete halfcut sheet"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column: Wishlists and Reviews Feed */}
        <div className="space-y-6">
          {/* Marketplace Wishlists */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#8A90A0] font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                Wishlist Items ({wishlistProductsCount})
              </h2>
              {hasMoreWishlists && (
                <button
                  type="button"
                  onClick={() => setShowAllWishlists(true)}
                  className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider cursor-pointer"
                >
                  View All
                </button>
              )}
            </div>
            
            {wishlistProductsCount === 0 ? (
              <div className="p-4 rounded-xl bg-surface/20 border border-white/5 text-center text-text-muted">
                Your wishlist is empty. Explore catalog items to save them!
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {/* 1. Show saved regular database products */}
                {displayedProducts.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-900/30 border border-slate-800 rounded-xl relative group" style={{ contentVisibility: 'auto' }}>
                    <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">Catalog Part</span>
                    <Link href={`/shop/${p.slug}`} className="text-white hover:text-primary font-bold text-xs truncate block max-w-full">
                      {p.name}
                    </Link>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-text-secondary">
                      <span className="text-emerald-400 font-extrabold">RM {Math.floor(p.price_retail ?? 0).toLocaleString('en-US')}</span>
                      <span>Catalog Original</span>
                    </div>
                  </div>
                ))}

                {/* 2. Show saved peer marketplace items */}
                {displayedMarketplaces.map((m) => {
                  const mImg = m.marketplace_images?.[0]?.image_url
                  const sellerProfile = m.users

                  return (
                    <div key={m.id} className="p-3 bg-slate-900/30 border border-slate-800 rounded-xl space-y-3" style={{ contentVisibility: 'auto' }}>
                      <div>
                        <div className="flex gap-2.5 items-center">
                          <div className="relative w-8 h-8 rounded bg-surface border border-slate-800 overflow-hidden flex-shrink-0">
                            {mImg ? (
                              <Image src={mImg} fill className="object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/20">
                                <ShoppingBag size={12} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-primary block">Marketplace Part</span>
                            <Link href={`/marketplace/${m.id}`} className="text-white hover:text-primary font-bold text-xs truncate block max-w-full">
                              {m.title}
                            </Link>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="text-emerald-400 font-extrabold">RM {Math.floor(m.price ?? 0).toLocaleString('en-US')}</span>
                          <span className="text-text-muted">{m.location || 'Malaysia'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-slate-800/40 pt-2.5">
                        {user?.id === sellerProfile?.id ? (
                          <button
                            disabled
                            className="h-7 border border-slate-800 bg-slate-900/40 text-slate-500 text-[10px] font-bold uppercase rounded-lg flex items-center justify-center gap-1 cursor-not-allowed"
                          >
                            <MessageCircle size={11} /> Own Listing
                          </button>
                        ) : (
                          <Link
                            href={`/chat/dm/${sellerProfile?.id || ''}?preset=${encodeURIComponent(`Hi there! I'm interested in your wishlisted item: "${m.title}" on Revoluzion!`)}`}
                            className="h-7 border border-primary/20 hover:border-primary bg-primary/5 text-primary text-[10px] font-bold uppercase rounded-lg flex items-center justify-center gap-1 transition-all"
                          >
                            <MessageCircle size={11} /> Chat DM
                          </Link>
                        )}
                        {user?.id === sellerProfile?.id ? (
                          <button
                            disabled
                            className="h-7 border border-slate-800 bg-slate-900/40 text-slate-500 text-[10px] font-bold uppercase rounded-lg flex items-center justify-center gap-1 cursor-not-allowed"
                          >
                            Own Activity
                          </button>
                        ) : (
                          <a
                            href={`https://wa.me/${sellerProfile?.phone?.replace(/[^0-9]/g, '') || ''}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-7 border border-emerald-500/20 hover:border-emerald-500 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold uppercase rounded-lg flex items-center justify-center gap-1 transition-all"
                          >
                            <Phone size={11} /> WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Seller Feedback and Reviews */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#8A90A0] font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                Incoming Feedbacks ({ratingsCount})
              </h2>
              {hasMoreReviews && (
                <button
                  type="button"
                  onClick={() => setShowAllReviews(true)}
                  className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider cursor-pointer"
                >
                  View All
                </button>
              )}
            </div>

            {ratingsCount === 0 ? (
              <div className="p-4 rounded-xl bg-surface/20 border border-white/5 text-center text-text-muted">
                You haven't received any customer review logs yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {displayedReviews.map((rev: any, rIdx) => (
                  <div key={rev.id || rIdx} className="p-3 bg-slate-900/35 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 relative overflow-hidden flex-shrink-0">
                          <DefaultAvatar />
                        </div>
                        <span className="text-white font-bold text-[10px]">@{rev.reviewer?.username || 'enthusiast'}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(5)].map((_, st) => (
                          <Star 
                            key={st} 
                            size={10} 
                            className={st < Math.floor(rev.rating) ? "fill-current" : "opacity-25"} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-text-secondary text-[11px] leading-relaxed italic">
                      "{rev.comment || 'Awesome seller, highly recommended for parts transactions!'}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Part Creation Modals/Popups */}
      {showCreateModal && (
        <CreateListingModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => { setShowCreateModal(false); router.refresh() }} 
        />
      )}

      {editingListing && (
        <EditListingModal 
          listing={editingListing} 
          onClose={() => setEditingListing(null)} 
          onSuccess={() => { setEditingListing(null); router.refresh() }} 
        />
      )}

      {/* Custom workshop Service editing popup modal slot */}
      {editingService && (
        <EditServiceDialog 
          service={editingService} 
          onSuccess={() => { setEditingService(null); router.refresh() }} 
        />
      )}

      {/* Wishlists expand popups */}
      {showAllWishlists && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAllWishlists(false)} />
          <div className="relative bg-surface border border-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                Fully Saved Wishlists ({wishlistProductsCount})
              </h3>
              <button onClick={() => setShowAllWishlists(false)} className="text-text-muted hover:text-white transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              {wishlistedProducts.map((p) => (
                <div key={p.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-cyan-400 block mb-0.5">Catalog Part</span>
                    <Link href={`/shop/${p.slug}`} className="text-white hover:text-primary font-bold text-xs truncate max-w-[200px] block">
                      {p.name}
                    </Link>
                  </div>
                  <span className="text-emerald-400 font-extrabold shrink-0">RM {Math.floor(p.price_retail ?? 0).toLocaleString('en-US')}</span>
                </div>
              ))}
              {wishlistedMarketplaces.map((m) => (
                <div key={m.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-primary block mb-0.5">Marketplace Part</span>
                    <Link href={`/marketplace/${m.id}`} className="text-white hover:text-primary font-bold text-xs truncate max-w-[200px] block">
                      {m.title}
                    </Link>
                  </div>
                  <span className="text-emerald-400 font-extrabold shrink-0">RM {Math.floor(m.price ?? 0).toLocaleString('en-US')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviews expand popups */}
      {showAllReviews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAllReviews(false)} />
          <div className="relative bg-surface border border-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                All Seller Feedbacks ({ratingsCount})
              </h3>
              <button onClick={() => setShowAllReviews(false)} className="text-text-muted hover:text-white transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              {sellerReviews.map((rev: any, rIdx) => (
                <div key={rev.id || rIdx} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-[10px]">@{rev.reviewer?.username || 'enthusiast'}</span>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, st) => (
                        <Star key={st} size={9} className={st < Math.floor(rev.rating) ? "fill-current" : "opacity-25"} />
                      ))}
                    </div>
                  </div>
                  <p className="text-text-secondary text-[11px] italic">
                    "{rev.comment || 'Awesome seller!'}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
