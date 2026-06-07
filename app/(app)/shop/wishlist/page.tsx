'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Package, ShoppingCart, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useWishlist } from '@/lib/shop/wishlist-context'
import { useCart } from '@/lib/shop/cart-context'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { WishlistItem } from '@/lib/shop/types'

export default function WishlistPage() {
  const { productIds, toggle } = useWishlist()
  const { addItem } = useCart()
  const [products, setProducts] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (productIds.size === 0) { setProducts([]); setLoading(false); return }
      const supabase = createClient()
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, sku_public, price_retail, stock_qty, product_images(url, sort_order)')
        .in('id', [...productIds])
        .eq('is_published', true)
        .eq('is_deleted', false)
      if (data) {
        setProducts(data.map((p) => {
          const imgs = (p.product_images as { url: string; sort_order: number }[] ?? [])
            .sort((a, b) => a.sort_order - b.sort_order)
          return { productId: p.id, name: p.name, sku: p.sku_public, slug: p.slug ?? p.id, imageUrl: imgs[0]?.url ?? null, priceRetail: p.price_retail, stockQty: p.stock_qty }
        }))
      }
      setLoading(false)
    }
    load()
  }, [productIds])

  async function addToCart(item: WishlistItem) {
    await addItem({ productId: item.productId, name: item.name, sku: item.sku, imageUrl: item.imageUrl, priceSnapshot: item.priceRetail, quantity: 1 })
    toast.success('Added to cart')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>Wishlist</h1>
        <p className="text-text-muted text-sm mt-1">{productIds.size} saved {productIds.size === 1 ? 'item' : 'items'}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-surface-variant rounded-t-xl" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-surface-variant rounded w-3/4" />
                <div className="h-3 bg-surface-variant rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center mx-auto mb-4">
            <Heart size={28} className="text-primary/30" />
          </div>
          <p className="text-text-secondary font-medium mb-1">Your wishlist is empty</p>
          <p className="text-text-muted text-sm mb-6">Save products you love to view them here.</p>
          <Link href="/shop" className="btn-primary inline-flex items-center gap-2">
            <ShoppingCart size={16} /> Browse Shop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((item) => (
            <div key={item.productId} className="card group overflow-hidden">
              <Link href={`/shop/${item.slug}`} className="block aspect-square relative overflow-hidden bg-surface-variant">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 50vw, 33vw" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={32} className="text-primary/20" />
                  </div>
                )}
                {item.stockQty === 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-xs font-medium text-white">Out of Stock</span>
                  </div>
                )}
              </Link>
              <div className="p-3">
                <p className="text-xs text-text-muted mb-0.5">{item.sku}</p>
                <Link href={`/shop/${item.slug}`}>
                  <p className="text-sm font-medium text-text-primary line-clamp-2 hover:text-primary transition-colors">{item.name}</p>
                </Link>
                <p className="text-primary font-semibold mt-1">{formatCurrency(item.priceRetail)}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => addToCart(item)}
                    disabled={item.stockQty === 0}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-primary text-black font-medium rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ShoppingCart size={12} /> Add to Cart
                  </button>
                  <button
                    onClick={() => { toggle(item.productId); toast.success('Removed from wishlist') }}
                    className="p-1.5 rounded-lg border border-border text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
