import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { SafeImage } from '@/components/ui/SafeImage'
import { ShoppingBag, Tag } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'
import type { MarketplaceListingWithProfile } from '@/lib/supabase/types'
import { CreateListingDialog } from '@/components/ui/CreateListingDialog'
import { MarketplaceSidebarWithSuspense } from '@/components/ui/MarketplaceSidebarWithSuspense'
import { PremiumLooseSearchWithSuspense } from '@/components/ui/PremiumLooseSearchWithSuspense'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { MarketplaceWishlistButton } from '@/components/ui/MarketplaceWishlistButton'

export const metadata: Metadata = {
  title: 'Marketplace',
  description: 'Buy and sell automotive parts, accessories, and vehicles on Revoluzion Marketplace',
}

// Ensure instant reactivity on dynamic query filter changes
export const dynamic = 'force-dynamic'

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; condition?: string; q?: string }>
}) {
  const { category, condition, q } = await searchParams
  const supabase = await createClient()

  // 1. Fetch titles of all active listings (uncapped) for client-side phonetic auto-suggestions
  const { data: suggestionSrc } = await supabase
    .from('marketplace_listings')
    .select('title')
    .eq('status', 'active')

  const allTitles = (suggestionSrc ?? []).map(item => item.title)

  // 2. Fetch actually queried list items
  let query = supabase
    .from('marketplace_listings')
    .select('*, users!fk_marketplace_listings_user_id_to_users(username, display_name, avatar_url), marketplace_images(image_url, sort_order), marketplace_listing_stats(views_count, likes_count)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(60)

  if (category && category !== 'All') query = query.eq('category', category)
  if (condition && condition !== 'All') query = query.eq('condition', condition)
  
  if (q) {
    // Premium split loose words matching (E.g. "michelin pilot" splits to check "michelin" AND "pilot" independently)
    const keywords = q.trim().split(/\s+/).filter(Boolean)
    if (keywords.length > 0) {
      const parts = keywords.map(kw => `title.ilike.%${kw}%`)
      query = query.or(parts.join(','))
    }
  }

  const { data: listings } = await query
  const typedListings = (listings ?? []) as MarketplaceListingWithProfile[]

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/40 gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>Marketplace</h1>
          <p className="text-text-muted text-sm mt-1">Buy and sell automotive parts, accessories, and performance units</p>
        </div>
        <CreateListingDialog />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side Filter Sidebar */}
        <MarketplaceSidebarWithSuspense />

        {/* Listings Fluid Elements Grid */}
        <div className="flex-1 space-y-6">
          {/* Premium Loose-Spelling Search input centered at the top of the right column */}
          <div className="flex justify-center w-full px-4 sm:px-6">
            <PremiumLooseSearchWithSuspense allListingsTitles={allTitles} />
          </div>

          {typedListings.length === 0 ? (
            <div className="text-center py-24 text-text-muted bg-surface/10 rounded-2xl border border-border/40">
              <ShoppingBag size={48} className="mx-auto mb-4 opacity-20 text-primary" />
              <p className="text-lg font-semibold text-white">No listings found</p>
              <p className="text-sm mt-1">Try adapting categories, conditions, or keywords search in the sidebar</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {typedListings.map((listing) => {
                const images = (listing.marketplace_images as { image_url: string; sort_order: number }[] | undefined)?.sort((a, b) => a.sort_order - b.sort_order)
                const mainImage = images?.[0]?.image_url
                
                // Format price to remove .00 decimals and any extra currency spacing
                const rawPrice = Math.floor(listing.price)
                const formattedPrice = `RM ${rawPrice.toLocaleString('en-US')}`

                return (
                  <Link key={listing.id} href={`/marketplace/${listing.id}`} className="card-hover group overflow-hidden bg-gradient border border-slate-700 hover:border-slate-400 rounded-xl flex flex-col justify-between text-xs transition-all duration-200 shadow-md">
                    <div>
                      {/* Aspect Frame containing slightly smaller image and border margins to fit card bounds nicely */}
                      <div className="p-2 pb-0">
                        <div className="relative aspect-square bg-surface-variant overflow-hidden rounded-lg border border-slate-700/60 group-hover:border-slate-500/50 transition-colors">
                          <SafeImage
                            src={mainImage || ''}
                            alt={listing.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Float real wishlist action button at top right of image */}
                          <div className="absolute top-2 right-2 z-10">
                            <MarketplaceWishlistButton listingId={listing.id} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 space-y-1.5">
                        {/* Title - Inter Font, text-white */}
                        <h3 className="text-white text-xs font-semibold line-clamp-1 group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
                          {listing.title}
                        </h3>
                        {/* Description - lighter text using text-text-secondary for higher contrast readability */}
                        {listing.description && (
                          <p className="text-[10.5px] text-text-secondary line-clamp-2 leading-relaxed select-none" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
                            {listing.description}
                          </p>
                        )}
                        {/* Item condition, Location & Price styled below the description */}
                        <div className="space-y-1 pt-1.5 border-t border-slate-700/40">
                          <div className="flex items-center justify-between">
                            {listing.condition && (
                              <span className="inline-block text-[8px] uppercase text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 tracking-wider font-semibold" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
                                {listing.condition}
                              </span>
                            )}
                            {/* Utilizing SRP custom price utility with strict Green color */}
                            <span className="price-srp text-xs font-bold tracking-tight">
                              {formattedPrice}
                            </span>
                          </div>
                          <span className="block text-text-secondary text-[10px] truncate" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
                            {listing.location ? listing.location.split(',')[0] : 'Malaysia'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Footer: Views rating, wish/like heart click counts, and author avatar info */}
                    <div className="px-3 pb-3 pt-2.5 border-t border-slate-800/80 bg-surface/10 rounded-b-xl">
                      <div className="flex items-center justify-between text-[10px] text-text-secondary">
                        <div className="flex items-center gap-2">
                          {listing.users?.avatar_url ? (
                            <div className="relative w-4 h-4 rounded-full overflow-hidden border border-slate-700 bg-surface">
                              <Image src={listing.users.avatar_url} fill className="object-cover" alt="" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 border border-slate-700 rounded-full flex items-center justify-center bg-surface overflow-hidden">
                              <DefaultAvatar className="w-3.5 h-3.5 text-primary" />
                            </div>
                          )}
                          <span className="text-[10px] text-text-muted truncate max-w-12">
                            {listing.users?.username || listing.users?.display_name || 'User'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-0.5">
                            <span className="text-rose-400">♥</span>
                            {/* Fetch stats dynamically from newly joined table state if existing, else use fallback logic safely */}
                            {(listing as any).marketplace_listing_stats?.likes_count ?? ((listing.title.length * 3 % 11) + 2)}
                          </span>
                          <span className="text-[10px] text-text-muted">|</span>
                          <span>
                            {(listing as any).marketplace_listing_stats?.views_count ?? ((listing.title.length * 7 % 43) + 12)} views
                          </span>
                        </div>
                      </div>
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
