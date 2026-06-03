import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Tag } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'
import type { MarketplaceListingWithProfile } from '@/lib/supabase/types'

export const metadata: Metadata = {
  title: 'Marketplace',
  description: 'Buy and sell automotive parts, accessories, and vehicles on Revoluzion Marketplace',
}

export const revalidate = 300

const CATEGORIES = ['All', 'Parts', 'Accessories', 'Tools', 'Tyres & Rims', 'Electronics', 'Exhaust', 'Suspension']
const CONDITIONS = ['All', 'New', 'Like New', 'Good', 'Fair']

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; condition?: string; q?: string }>
}) {
  const { category, condition, q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('marketplace_listings')
    .select('*, profiles(username, display_name, avatar_url), marketplace_images(image_url, sort_order)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(60)

  if (category && category !== 'All') query = query.eq('category', category)
  if (condition && condition !== 'All') query = query.eq('condition', condition)
  if (q) query = query.ilike('title', `%${q}%`)

  const { data: listings = [] } = await query
  const typedListings = listings as MarketplaceListingWithProfile[]

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Marketplace</h1>
        <p className="text-text-muted text-sm mt-1">Buy and sell automotive parts and accessories</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/marketplace?category=${cat}${condition ? `&condition=${condition}` : ''}${q ? `&q=${q}` : ''}`}
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

      {/* Condition filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {CONDITIONS.map((cond) => (
          <Link
            key={cond}
            href={`/marketplace?${category ? `category=${category}&` : ''}condition=${cond}${q ? `&q=${q}` : ''}`}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs border transition-colors ${
              (condition || 'All') === cond
                ? 'bg-teal text-black border-teal'
                : 'bg-surface text-text-muted border-border hover:border-teal/50'
            }`}
          >
            {cond}
          </Link>
        ))}
      </div>

      {typedListings.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">No listings found</p>
          <p className="text-sm mt-1">Try adjusting filters or check back later</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {typedListings.map((listing) => {
            const images = (listing.marketplace_images as { image_url: string; sort_order: number }[] | undefined)?.sort((a, b) => a.sort_order - b.sort_order)
            const mainImage = images?.[0]?.image_url
            return (
              <Link key={listing.id} href={`/marketplace/${listing.id}`} className="card-hover group overflow-hidden">
                <div className="aspect-square bg-surface-variant overflow-hidden">
                  {mainImage ? (
                    <Image
                      src={mainImage}
                      alt={listing.title}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Tag size={28} className="text-primary/40" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  {listing.condition && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-variant text-text-muted border border-border mr-1">{listing.condition}</span>
                  )}
                  <h3 className="text-text-primary text-sm font-medium mt-1.5 line-clamp-2">{listing.title}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-primary font-bold">{formatCurrency(listing.price)}</span>
                    {listing.location && (
                      <span className="text-text-muted text-xs truncate ml-2">{listing.location}</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
