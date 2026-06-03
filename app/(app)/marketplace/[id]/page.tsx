import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, Tag, Phone, MessageCircle } from 'lucide-react'
import { formatCurrency, timeAgo, getInitials } from '@/lib/utils'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('marketplace_listings').select('title, price').eq('id', id).single()
  if (!data) return { title: 'Listing Not Found' }
  return {
    title: data.title,
    description: `${formatCurrency(data.price)} — Available on Revoluzion Marketplace`,
  }
}

export default async function MarketplaceListingPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('marketplace_listings')
    .select('*, profiles(username, display_name, avatar_url, is_verified), marketplace_images(image_url, sort_order)')
    .eq('id', id)
    .single()

  if (!listing) notFound()

  const profile = listing.profiles
  const images = (listing.marketplace_images as { image_url: string; sort_order: number }[] | undefined)?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order) ?? []

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link href="/marketplace" className="inline-flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors text-sm mb-4">
        <ArrowLeft size={16} /> Back to Marketplace
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div className="space-y-3">
          {images.length > 0 ? (
            <>
              <div className="rounded-xl overflow-hidden border border-border aspect-square bg-surface-variant">
                <Image
                  src={images[0].image_url}
                  alt={listing.title}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.slice(1).map((img: { image_url: string }, i: number) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border bg-surface-variant">
                      <Image src={img.image_url} alt={`Image ${i + 2}`} width={150} height={150} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-square rounded-xl bg-surface-variant border border-border flex items-center justify-center">
              <Tag size={48} className="text-primary/30" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {listing.category && <span className="badge-primary">{listing.category}</span>}
              {listing.condition && <span className="badge">{listing.condition}</span>}
              {listing.status === 'sold' && <span className="badge bg-error/20 text-error border-error/30">Sold</span>}
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">{listing.title}</h1>
            <div className="text-3xl font-bold text-primary">{formatCurrency(listing.price)}</div>
          </div>

          {listing.description && (
            <div>
              <h2 className="font-semibold text-text-primary mb-2 text-sm">Description</h2>
              <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            </div>
          )}

          {listing.location && (
            <div className="flex items-center gap-2 text-text-muted text-sm">
              <MapPin size={14} className="text-primary" />
              <span>{listing.location}</span>
            </div>
          )}

          {/* Seller card */}
          {profile && (
            <div className="card p-4">
              <h3 className="text-xs text-text-muted uppercase tracking-wide mb-3">Seller</h3>
              <Link href={`/u/${profile.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover border border-border" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold">
                    {getInitials(profile.display_name || profile.username || 'U')}
                  </div>
                )}
                <div>
                  <div className="font-medium text-text-primary text-sm">{profile.display_name || profile.username}</div>
                  <div className="text-text-muted text-xs">@{profile.username}</div>
                </div>
                {profile.is_verified && <span className="badge-primary ml-auto text-xs">Verified</span>}
              </Link>
            </div>
          )}

          {listing.status === 'active' && (
            <button className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
              <MessageCircle size={18} /> Contact Seller
            </button>
          )}

          <p className="text-text-disabled text-xs">Posted {timeAgo(listing.created_at)}</p>
        </div>
      </div>
    </div>
  )
}
