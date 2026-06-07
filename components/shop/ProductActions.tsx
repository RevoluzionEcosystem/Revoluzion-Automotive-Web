'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ShoppingCart, Heart, Minus, Plus, Loader2, Package } from 'lucide-react'
import { useCart } from '@/lib/shop/cart-context'
import { useWishlist } from '@/lib/shop/wishlist-context'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

interface Props {
  productId: string
  name: string
  sku: string
  imageUrl: string | null
  priceRetail: number
  priceDealer: number | null  // null = not a dealer
  stockQty: number
  stockAlert: number
  weight: number | null
  dimensions?: string | null
}

export function ProductActions({
  productId, name, sku, imageUrl, priceRetail, priceDealer, stockQty, stockAlert, weight,
  dimensions,
}: Props) {
  const router = useRouter()
  const { addItem } = useCart()
  const { isWishlisted, toggle } = useWishlist()
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)

  const wishlisted = isWishlisted(productId)
  const outOfStock = stockQty === 0
  const lowStock = stockQty > 0 && stockQty <= stockAlert
  const isDealer = priceDealer !== null
  const displayPrice = isDealer ? priceDealer : priceRetail

  async function handleAddToCart() {
    if (outOfStock) return
    setAdding(true)
    await addItem({ productId, name, sku, imageUrl, priceSnapshot: displayPrice, quantity: qty })
    toast.success(`${name} added to cart`, {
      action: { label: 'View Cart', onClick: () => { router.push('/shop/cart') } },
    })
    setAdding(false)
  }

  return (
    <div className="space-y-4">
      {/* Dealer badge */}
      {isDealer && (
        <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
          <Package size={14} className="text-orange-400/80 shrink-0" />
          <div className="text-xs">
            <span className="text-orange-400/80 font-semibold">Dealer Price Applied</span>
            <span className="text-text-muted ml-2 line-through">{formatCurrency(priceRetail)}</span>
          </div>
        </div>
      )}

      {/* Stock notice */}
      {lowStock && !outOfStock && (
        <p className="text-amber-400 text-sm font-medium">Low stock — order soon</p>
      )}

      {/* Qty selector + wishlist row */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-surface-variant rounded-lg p-1">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}
            className="p-2 rounded text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors">
            <Minus size={14} />
          </button>
          <input
            type="number"
            min={1}
            max={stockQty || 99}
            value={qty}
            onChange={(e) => {
              const v = parseInt(e.target.value)
              if (!isNaN(v)) setQty(Math.max(1, Math.min(stockQty || 99, v)))
            }}
            className="w-10 text-center font-medium bg-transparent focus:outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button onClick={() => setQty((q) => Math.min(stockQty || 99, q + 1))} disabled={outOfStock || qty >= stockQty}
            className="p-2 rounded text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors">
            <Plus size={14} />
          </button>
        </div>

        <button
          onClick={() => { const was = isWishlisted(productId); toggle(productId); toast.success(was ? 'Removed from wishlist' : 'Saved to wishlist') }}
          className={`p-2.5 rounded-lg transition-colors ${wishlisted ? 'bg-red-500/10 text-red-400' : 'text-text-muted hover:text-red-400'}`}
          title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* SKU / Stock / Weight / Dimensions row */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div className="bg-surface-variant rounded-lg px-3 py-2">
          <p className="text-text-muted mb-0.5">SKU</p>
          <p className="font-mono font-medium text-text-primary truncate">{sku || '—'}</p>
        </div>
        <div className="bg-surface-variant rounded-lg px-3 py-2">
          <p className="text-text-muted mb-0.5">Stock</p>
          <p className={`font-semibold ${outOfStock ? 'text-red-400' : lowStock ? 'text-amber-400' : 'text-green-400'}`}>
            {outOfStock ? 'Out of Stock' : `${stockQty} units`}
          </p>
        </div>
        <div className="bg-surface-variant rounded-lg px-3 py-2">
          <p className="text-text-muted mb-0.5">Weight</p>
          <p className="font-medium text-text-primary">{weight ? `${weight} kg` : '—'}</p>
        </div>
        <div className="bg-surface-variant rounded-lg px-3 py-2">
          <p className="text-text-muted mb-0.5">Dimensions</p>
          <p className="font-medium text-text-primary">{dimensions ?? '—'}</p>
        </div>
      </div>

      {/* Price — directly above Add to Cart */}
      <div className="flex items-baseline gap-2 pt-1">
        <span className={outOfStock ? 'price-out-of-stock text-2xl' : isDealer ? 'price-dealer text-2xl' : 'price-srp text-2xl'}>
          {formatCurrency(displayPrice)}
        </span>
        {outOfStock && <span className="text-sm text-red-400 font-medium">Out of Stock</span>}
        {!outOfStock && lowStock && (
          <span className="text-xs text-amber-400 font-medium">Only {stockQty} left</span>
        )}
        {!outOfStock && !isDealer && (
          <span className="text-xs text-text-muted ml-auto">incl. SST</span>
        )}
      </div>

      {/* Add to cart */}
      <button onClick={handleAddToCart} disabled={outOfStock || adding}
        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-black font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base">
        {adding ? <><Loader2 size={18} className="animate-spin" /> Adding…</>
          : outOfStock ? 'Out of Stock'
          : <><ShoppingCart size={18} /> Add to Cart</>}
      </button>

      <Link href="/shop/cart" className="block text-center text-sm text-text-muted hover:text-primary transition-colors">
        View Cart →
      </Link>
    </div>
  )
}