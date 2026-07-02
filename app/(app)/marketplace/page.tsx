import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Tag } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'
import type { MarketplaceListingWithProfile } from '@/lib/supabase/types'
import { CreateListingDialog } from '@/components/ui/CreateListingDialog'
import { MarketplaceSidebarWithSuspense } from '@/components/ui/MarketplaceSidebarWithSuspense'
import { PremiumLooseSearchWithSuspense } from '@/components/ui/PremiumLooseSearchWithSuspense'

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
    .select('*, users!fk_marketplace_listings_user_id_to_users(username, display_name, avatar_url), marketplace_images(image_url, sort_order)')
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
                  <Link key={listing.id} href={`/marketplace/${listing.id}`} className="card-hover group overflow-hidden bg-surface/30 border border-border/40 rounded-xl flex flex-col justify-between text-xs transition-all duration-200">
                    <div>
                      {/* 1:1 Aspect Ratio Image Frame */}
                      <div className="relative aspect-square bg-surface-variant overflow-hidden rounded-t-xl border-b border-border/20">
                        {mainImage ? (
                          <Image
                            src={mainImage}
                            alt={listing.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tag size={20} className="text-primary/30" />
                          </div>
                        )}
                        {listing.condition && (
                          <div className="absolute top-2 left-2">
                            <span className="text-[8px] font-black uppercase text-primary bg-black/80 border border-primary/20 rounded px-1.5 py-0.5 tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>
                              {listing.condition}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-3 space-y-2">
                        {/* Title - group hover to color change */}
                        <h3 className="text-white text-xs font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                          {listing.title}
                        </h3>
                        {/* Description - truncated to exactly 2 rows */}
                        {listing.description && (
                          <p className="text-[10.5px] text-text-muted line-clamp-2 leading-relaxed opacity-75 select-none">
                            {listing.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Metadata Footer: location on the left, price in green on the right (no decimals) */}
                    <div className="p-3 pt-0">
                      <div className="flex items-center justify-between border-t border-border/20 pt-2">
                        {listing.location ? (
                          <span className="text-text-muted text-[10px] truncate max-w-[90px]">{listing.location.split(',')[0]}</span>
                        ) : (
                          <span className="text-text-muted text-[10px]">Malaysia</span>
                        )}
                        <span className="text-emerald-400 text-xs font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-orbitron)' }}>
                          {formattedPrice}
                        </span>
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
