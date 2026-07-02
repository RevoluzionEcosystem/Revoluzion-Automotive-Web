'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  ShoppingBag, ArrowLeft, Heart, Eye, Star, Plus, Phone,
  MessageCircle, Trash2, Edit3, ShieldAlert, X
} from 'lucide-react'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { CreateListingModal } from '@/components/ui/CreateListingModal'
import { EditListingModal } from '@/components/ui/EditListingModal'
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
  wishlistProductsCount: number
  wishlistedProducts: any[]
  wishlistedMarketplaces: any[]
  sellerReviews: any[]
}

export function DashboardClient({
  user,
  activeCount,
  soldCount,
  ratingStars,
  ratingsCount,
  totalViews,
  totalLikes,
  userListings,
  wishlistProductsCount,
  wishlistedProducts,
  wishlistedMarketplaces,
  sellerReviews,
}: DashboardProps) {
  const supabase = createClient()
  const router = useRouter()
  const [listings, setListings] = useState<any[]>(userListings)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingListing, setEditingListing] = useState<any | null>(null)

  // Modals for listing full views beyond 5 items limit
  const [showAllWishlists, setShowAllWishlists] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)

  // Splitted arrays for up to 5 items mapping values
  const hasMoreWishlists = wishlistProductsCount > 5
  const hasMoreReviews = sellerReviews.length > 5

  const displayedProducts = wishlistedProducts.slice(0, 3)
  const remainingSlots = 5 - displayedProducts.length
  const displayedMarketplaces = wishlistedMarketplaces.slice(0, Math.max(0, remainingSlots))

  const displayedReviews = sellerReviews.slice(0, 5)

  const handleRefresh = async () => {
    const { data } = await supabase
      .from('marketplace_listings')
      .select('*, marketplace_images(image_url, sort_order), marketplace_listing_stats(views_count, likes_count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setListings(data)
  }

  const handleDelete = async (id: string) => {
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

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 text-xs">
      {/* Header Back Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-700/60 gap-4">
        <div className="space-y-1">
          <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-secondary transition-colors text-[11px] mb-2 font-medium">
            <ArrowLeft size={13} /> Back to Marketplace
          </Link>
          <h1 className="text-2xl font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>
            Seller Dashboard
          </h1>
          <p className="text-text-secondary text-xs">Manage active parts, track visitor counters, view incoming buyer ratings, and see saved catalog wishlists</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="h-10 px-5 bg-primary text-black font-bold uppercase tracking-wider rounded-xl transition-all duration-200 hover:opacity-90 active:scale-98 flex items-center justify-center gap-1.5 self-start sm:self-auto"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          <Plus size={16} /> Create Listing
        </button>
      </div>

      {/* Stats Summary Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient border border-slate-700 rounded-xl flex flex-col justify-between">
          <span className="text-text-muted text-[10px] font-black uppercase tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>Active Parts</span>
          <span className="text-2xl font-black text-primary mt-2">{activeCount}</span>
        </div>
        <div className="p-4 bg-gradient border border-slate-700 rounded-xl flex flex-col justify-between">
          <span className="text-text-muted text-[10px] font-black uppercase tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>Sold Listings</span>
          <span className="text-2xl font-black text-emerald-400 mt-2">{soldCount}</span>
        </div>
        <div className="p-4 bg-gradient border border-slate-700 rounded-xl flex flex-col justify-between">
          <span className="text-text-muted text-[10px] font-black uppercase tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>Rating Score</span>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-2xl font-black text-amber-400">{ratingStars}</span>
            <div className="flex items-center text-amber-500">
              <Star size={14} className="fill-current" />
            </div>
            <span className="text-text-muted text-[10px]">({ratingsCount} reviews)</span>
          </div>
        </div>
        <div className="p-4 bg-gradient border border-slate-700 rounded-xl flex flex-col justify-between">
          <span className="text-text-muted text-[10px] font-black uppercase tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>Analytics Index</span>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-text-secondary flex items-center gap-1"><Eye size={12} className="text-[#8A90A0]" /> {totalViews}</span>
            <span className="text-xs text-text-secondary flex items-center gap-1"><Heart size={12} className="text-rose-400 fill-current" /> {totalLikes}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Manage Listings */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-[#8A90A0] pb-2 border-b border-slate-700/40" style={{ fontFamily: 'var(--font-orbitron)' }}>Your Live Listings</h2>
          
          {listings.length === 0 ? (
            <div className="text-center py-16 bg-surface/20 border border-slate-700/60 rounded-xl space-y-3">
              <p className="text-text-secondary text-sm">You have not published any components or spare parts yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary text-xs uppercase"
              >
                Create Listing Now
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {listings.map((item) => {
                const images = (item.marketplace_images as any[])?.sort((a,b) => a.sort_order - b.sort_order)
                const mainImage = images?.[0]?.image_url
                const priceVal = Math.floor(item.price)

                return (
                  <div key={item.id} className="bg-gradient border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center transition-all duration-200">
                    <div className="flex gap-3 items-center min-w-0">
                      <div className="relative w-14 h-14 bg-surface-variant rounded-lg overflow-hidden border border-slate-700/50 flex-shrink-0">
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

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-slate-800 sm:border-0 pt-3 sm:pt-0">
                      <span className="text-emerald-400 text-sm font-extrabold tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>
                        RM {priceVal.toLocaleString('en-US')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingListing(item)}
                          className="p-1.5 rounded-lg border border-slate-700 bg-surface text-text-secondary hover:text-white hover:border-slate-500 transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg border border-red-950 bg-red-950/15 text-rose-400 hover:text-white hover:bg-rose-500 hover:border-rose-500 transition-all duration-150"
                          title="Delete"
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

        {/* Right Column: Wishlists and Reviews Feed */}
        <div className="space-y-6">
          {/* Marketplace Wishlists */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-700/40">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#8A90A0]" style={{ fontFamily: 'var(--font-orbitron)' }}>
                Wishlisted Saved Items ({wishlistProductsCount})
              </h2>
              {hasMoreWishlists && (
                <button
                  type="button"
                  onClick={() => setShowAllWishlists(true)}
                  className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider"
                >
                  View All
                </button>
              )}
            </div>
            
            {wishlistProductsCount === 0 ? (
              <div className="p-4 rounded-xl bg-surface/20 border border-slate-700/40 text-center text-text-muted">
                Your wishlist is empty. Explore products to save them!
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {/* 1. Show saved regular database products */}
                {displayedProducts.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-900/30 border border-slate-800 rounded-xl relative group">
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
                  const waPhone = sellerProfile?.phone?.replace(/[^0-9]/g, '') ?? '60123456789'
                  const mWaUrl = `https://wa.me/${waPhone.startsWith('60') || waPhone.startsWith('1') ? waPhone : '6' + waPhone}?text=Hi%20there,%20I'm%20interested%20in%20your%20saved%20listing:%20${encodeURIComponent(m.title)}%20on%20Revoluzion!`

                  return (
                    <div key={m.id} className="p-3 bg-slate-900/30 border border-slate-800 rounded-xl space-y-3">
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

                      {/* Transact actions on Wishlist items - direct WhatsApp or private chat, just like Facebook */}
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
                            <Phone size={11} /> Own Listing
                          </button>
                        ) : (
                          <a
                            href={mWaUrl}
                            target="_blank"
                            rel="noreferrer"
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

          {/* Seller reviews mapping */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-700/40">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#8A90A0]" style={{ fontFamily: 'var(--font-orbitron)' }}>
                Seller Reputation Ratings
              </h2>
              {hasMoreReviews && (
                <button
                  type="button"
                  onClick={() => setShowAllReviews(true)}
                  className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider"
                >
                  View All
                </button>
              )}
            </div>
            
            {sellerReviews.length === 0 ? (
              <div className="p-4 rounded-xl bg-surface/20 border border-slate-700/40 text-center text-text-muted">
                No buyer reputation reviews recorded yet for your account profile.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {displayedReviews.map((rev, index) => {
                  const revName = rev.reviewer?.display_name || rev.reviewer?.username || 'Anonymous User'
                  return (
                    <div key={index} className="p-3 bg-gradient border border-slate-700 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-[10.5px]">@{rev.reviewer?.username || 'anonymous'}</span>
                        <div className="flex text-amber-500 gap-0.5">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} size={10} className="fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-text-muted text-[10.5px] leading-relaxed italic">"{rev.comment}"</p>
                      <div className="text-[9px] text-text-disabled text-right">
                        by {revName}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Action Modals */}
      {showCreateModal && (
        <CreateListingModal
          onSuccess={() => {
            setShowCreateModal(false)
            handleRefresh()
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingListing && (
        <EditListingModal
          listing={editingListing}
          onSuccess={() => {
            setEditingListing(null)
            handleRefresh()
          }}
          onClose={() => setEditingListing(null)}
        />
      )}

      {/* VIEW ALL WISHLIST MODAL */}
      {showAllWishlists && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-surface border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-background">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>
                All Saved Wishlists ({wishlistProductsCount})
              </h3>
              <button onClick={() => setShowAllWishlists(false)} className="p-1.5 rounded-lg hover:bg-surface-variant text-text-muted transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
              {wishlistedProducts.map((p) => (
                <div key={p.id} className="p-3 bg-slate-900/30 border border-slate-800 rounded-xl relative">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">Catalog Part</span>
                  <Link href={`/shop/${p.slug}`} className="text-white hover:text-primary font-bold text-xs truncate block max-w-full">
                    {p.name}
                  </Link>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-text-secondary">
                    <span className="text-emerald-400 font-bold">RM {Math.floor(p.price_retail ?? 0).toLocaleString('en-US')}</span>
                    <span>Catalog Original</span>
                  </div>
                </div>
              ))}

              {wishlistedMarketplaces.map((m) => {
                const mImg = m.marketplace_images?.[0]?.image_url
                const sellerProfile = m.users
                const waPhone = sellerProfile?.phone?.replace(/[^0-9]/g, '') ?? '60123456789'
                const mWaUrl = `https://wa.me/${waPhone.startsWith('60') || waPhone.startsWith('1') ? waPhone : '6' + waPhone}?text=Hi%20there,%20I'm%20interested%20in%20your%20saved%20listing:%20${encodeURIComponent(m.title)}%20on%20Revoluzion!`

                return (
                  <div key={m.id} className="p-3 bg-slate-900/30 border border-slate-800 rounded-xl space-y-3">
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
                        <Link href={`/marketplace/${m.id}`} className="text-white hover:text-primary font-bold text-xs truncate block">
                          {m.title}
                        </Link>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-400 font-bold">RM {Math.floor(m.price ?? 0).toLocaleString('en-US')}</span>
                      <span className="text-text-muted">{m.location || 'Malaysia'}</span>
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
                          <Phone size={11} /> Own Listing
                        </button>
                      ) : (
                        <a
                          href={mWaUrl}
                          target="_blank"
                          rel="noreferrer"
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
          </div>
        </div>
      )}

      {/* VIEW ALL REVIEWS MODAL */}
      {showAllReviews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-surface border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-background">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>
                All Seller Reviews ({ratingsCount})
              </h3>
              <button onClick={() => setShowAllReviews(false)} className="p-1.5 rounded-lg hover:bg-surface-variant text-text-muted transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {sellerReviews.map((rev, index) => {
                const revName = rev.reviewer?.display_name || rev.reviewer?.username || 'Anonymous User'
                return (
                  <div key={index} className="p-3 bg-gradient border border-slate-700 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-[10.5px]">@{rev.reviewer?.username || 'anonymous'}</span>
                      <div className="flex text-amber-500 gap-0.5">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} size={10} className="fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-text-muted text-[10.5px] leading-relaxed italic">"{rev.comment}"</p>
                    <div className="text-[9px] text-text-disabled text-right">
                      by {revName}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
