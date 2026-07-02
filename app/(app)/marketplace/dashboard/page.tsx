import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { DashboardClient } from './DashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Marketplace Dashboard',
  description: 'Manage your listings, wishlist, and views directly from Revoluzion Automotive',
}

export const dynamic = 'force-dynamic'

export default async function MarketplaceDashboardPage() {
  const supabase = await createClient()

  // 1. Get the current active profile
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>Access Restricted</h2>
        <p className="text-text-secondary text-sm">Please sign in to view your personalized components dashboard.</p>
        <Link href="/login" className="btn-primary inline-block">Sign In</Link>
      </div>
    )
  }

  // 2. Fetch all user listings (active, inactive, sold)
  const { data: listings } = await supabase
    .from('marketplace_listings')
    .select('*, marketplace_images(image_url, sort_order), marketplace_listing_stats(views_count, likes_count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const userListings = listings ?? []
  const soldCount = userListings.filter(l => l.status === 'sold').length
  const activeCount = userListings.filter(l => l.status === 'active').length

  // Fetch real statistics joined securely from the new database stats tables
  const totalViews = userListings.reduce((acc, l) => acc + ((l as any).marketplace_listing_stats?.views_count ?? 0), 0)
  const totalLikes = userListings.reduce((acc, l) => acc + ((l as any).marketplace_listing_stats?.likes_count ?? 0), 0)

  // Fetch real seller reviews feed from PostgreSQL table
  const { data: dbReviews } = await supabase
    .from('marketplace_seller_reviews')
    .select('rating, comment, created_at, reviewer:users!fk_marketplace_seller_reviews_reviewer_id_to_users(id, username, display_name)')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  const sellerReviews = dbReviews ?? []
  
  let ratingStars = 5.0
  const ratingsCount = sellerReviews.length
  if (ratingsCount > 0) {
    const sum = sellerReviews.reduce((acc, r) => acc + r.rating, 0)
    ratingStars = parseFloat((sum / ratingsCount).toFixed(1))
  }

  // 3. Fetch user wishlist mapping
  const { data: wishlistData } = await supabase
    .from('wishlists')
    .select('id, product_id, created_at')
    .eq('user_id', user.id)

  const wishlistRaw = wishlistData ?? []
  const wishlistIds = wishlistRaw.map(w => w.product_id)

  // Fetch product items details and marketplace listings details separately for the wishlist rows
  let wishlistedProducts: any[] = []
  let wishlistedMarketplaces: any[] = []

  if (wishlistIds.length > 0) {
    const { data: pItems } = await supabase
      .from('products')
      .select('id, name, price_retail, slug')
      .in('id', wishlistIds)

    if (pItems) wishlistedProducts = pItems

    const { data: mItems } = await supabase
      .from('marketplace_listings')
      .select('id, title, price, location, marketplace_images(image_url), users!fk_marketplace_listings_user_id_to_users(id, username, display_name, phone)')
      .in('id', wishlistIds)

    if (mItems) wishlistedMarketplaces = mItems
  }

  return (
    <DashboardClient
      user={user}
      activeCount={activeCount}
      soldCount={soldCount}
      ratingStars={ratingStars}
      ratingsCount={ratingsCount}
      totalViews={totalViews}
      totalLikes={totalLikes}
      userListings={userListings}
      wishlistProductsCount={wishlistRaw.length}
      wishlistedProducts={wishlistedProducts}
      wishlistedMarketplaces={wishlistedMarketplaces}
      sellerReviews={sellerReviews}
    />
  )
}
