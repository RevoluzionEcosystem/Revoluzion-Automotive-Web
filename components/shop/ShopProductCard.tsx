'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Package, Zap, Heart, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/lib/shop/cart-context'
import { useWishlist } from '@/lib/shop/wishlist-context'
import { toast } from 'sonner'
import { useState } from 'react'

interface Props {
  productId: string; name: string; slug: string; sku: string; priceRetail: number
  stockQty: number; isFeatured: boolean; shortDescription: string | null
  categoryName: string | null; imageUrl: string | null; priority?: boolean
}

export function ShopProductCard({ productId, name, slug, sku, priceRetail, stockQty, isFeatured, categoryName, imageUrl, priority = false }: Props) {
  const router = useRouter()
  const { addItem } = useCart()
  const { isWishlisted, toggle } = useWishlist()
  const [adding, setAdding] = useState(false)

  const wishlisted = isWishlisted(productId)
  const outOfStock = stockQty === 0
  const href = `/shop/${slug}`

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    if (outOfStock || adding) return
    setAdding(true)
    await addItem({ productId, name, sku, imageUrl, priceSnapshot: priceRetail, quantity: 1 })
    toast.success('Added to cart', { action: { label: 'View Cart', onClick: () => { router.push('/shop/cart') } } })
    setAdding(false)
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    const was = isWishlisted(productId)
    toggle(productId)
    toast.success(was ? 'Removed from wishlist' : 'Saved to wishlist')
  }

  return (
    <div className={`rounded-xl border overflow-hidden flex flex-col group transition-colors ${outOfStock ? 'border-border opacity-70' : 'bg-surface border-border hover:border-primary/30'}`}>
      {/* Image */}
      <Link href={href} className="block aspect-square relative overflow-hidden bg-surface-variant">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill
            loading={priority ? 'eager' : 'lazy'}
            priority={priority}
            sizes="(max-width:640px)48vw,(max-width:768px)32vw,(max-width:1024px)24vw,(max-width:1280px)19vw,(max-width:1536px)16vw,14vw"
            className={`object-cover transition-transform duration-300 ${outOfStock ? '' : 'group-hover:scale-105'}`} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-variant">
            <Package size={36} className="text-primary/20" />
          </div>
        )}

        {/* Out-of-stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-end justify-center pb-3">
            <span className="text-xs font-semibold text-white/80 bg-black/70 px-3 py-1 rounded-full border border-white/10">
              Out of Stock
            </span>
          </div>
        )}

        {/* Featured badge */}
        {isFeatured && !outOfStock && (
          <div className="absolute top-2 left-2">
            <span className="bg-primary text-black text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Zap size={7} /> FEATURED
            </span>
          </div>
        )}

        {/* Wishlist — top right, larger */}
        <button onClick={handleWishlist}
          className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm transition-colors z-10 ${wishlisted ? 'text-red-400' : 'text-white/70 hover:text-red-400'}`}>
          <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
      </Link>

      {/* Body */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        {categoryName && <span className="text-[10px] text-text-muted uppercase tracking-wide">{categoryName}</span>}
        <Link href={href}>
          <h3 className="text-text-primary text-sm font-medium line-clamp-2 leading-snug hover:text-primary transition-colors" style={{ fontFamily: "var(--font-inter)" }}>{name}</h3>
        </Link>
        {/* Price — right-aligned, larger */}
        <div className="flex items-center justify-end mt-auto pt-1.5">
          <span className={outOfStock ? "price-out-of-stock text-base" : "price-srp text-base"}>
            {formatCurrency(priceRetail)}
          </span>
        </div>
        {/* Add to Cart */}
        <button onClick={handleAdd} disabled={outOfStock || adding}
          className={`mt-1 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
            outOfStock ? 'bg-surface-variant text-text-muted cursor-default' : 'bg-primary/10 text-primary hover:bg-primary hover:text-black disabled:opacity-40 disabled:cursor-not-allowed'
          }`}>
          {adding ? <><Loader2 size={11} className="animate-spin" /> Adding...</>
            : outOfStock ? 'Out of Stock'
            : <><ShoppingCart size={11} /> Add to Cart</>}
        </button>
      </div>
    </div>
  )
}