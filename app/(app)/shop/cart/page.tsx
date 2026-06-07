'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Trash2, Package, ArrowRight, Minus, Plus, Heart } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/lib/shop/cart-context'
import { toast } from 'sonner'

export default function CartPage() {
  const { items, totalQty, subtotal, removeItem, updateQty, clearCart } = useCart()
  const router = useRouter()

  const shippingFee = subtotal >= 200 ? 0 : 8.90
  const total = subtotal + shippingFee

  async function handleCheckout() {
    if (items.length === 0) return
    router.push('/shop/pay')
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-surface-variant flex items-center justify-center mx-auto mb-6">
          <ShoppingCart size={32} className="text-primary/40" />
        </div>
        <h1 className="text-xl font-bold text-text-primary mb-2" style={{ fontFamily: 'var(--font-orbitron)' }}>Your Cart is Empty</h1>
        <p className="text-text-muted text-sm mb-8">Add products from the shop to get started.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/shop" className="btn-primary flex items-center justify-center gap-2">
            <ShoppingCart size={16} /> Browse Shop
          </Link>
          <Link href="/shop/wishlist" className="btn-secondary flex items-center justify-center gap-2">
            <Heart size={16} /> View Wishlist
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>
          Cart <span className="text-text-muted text-base font-normal">({totalQty} {totalQty === 1 ? 'item' : 'items'})</span>
        </h1>
        <button onClick={() => { clearCart(); toast.success('Cart cleared') }} className="text-xs text-red-400 hover:text-red-300 transition-colors">
          Clear all
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="card flex gap-4 p-4">
              {/* Image */}
              <Link href={`/shop/${item.productId}`} className="shrink-0">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface-variant">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} width={80} height={80} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={24} className="text-primary/20" />
                    </div>
                  )}
                </div>
              </Link>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <Link href={`/shop/${item.productId}`}>
                  <p className="text-sm font-medium text-text-primary line-clamp-2 hover:text-primary transition-colors">{item.name}</p>
                </Link>
                <p className="text-xs text-text-muted mt-0.5">{item.sku}</p>
                <p className="price-srp mt-1">{formatCurrency(item.priceSnapshot)}</p>
              </div>

              {/* Qty + Remove */}
              <div className="flex flex-col items-end justify-between shrink-0">
                <button
                  onClick={() => { removeItem(item.productId); toast.success(`${item.name} removed`) }}
                  className="p-1.5 text-text-muted hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
                <div className="flex items-center gap-2 bg-surface-variant rounded-lg p-1">
                  <button
                    onClick={() => updateQty(item.productId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="p-1 rounded text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => {
                      const v = parseInt(e.target.value)
                      if (!isNaN(v) && v >= 1) updateQty(item.productId, v)
                    }}
                    className="text-sm font-medium w-8 text-center bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => updateQty(item.productId, item.quantity + 1)}
                    className="p-1 rounded text-text-muted hover:text-text-primary transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <p className="text-xs text-text-muted">{formatCurrency(item.priceSnapshot * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-5 space-y-4 sticky top-20">
            <h2 className="font-semibold text-text-primary">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal ({totalQty} items)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Shipping</span>
                <span className={shippingFee === 0 ? 'text-green-400' : ''}>
                  {shippingFee === 0 ? 'FREE' : formatCurrency(shippingFee)}
                </span>
              </div>
              {shippingFee > 0 && (
                <p className="text-[11px] text-text-muted">Free shipping on orders over RM200</p>
              )}
              <div className="border-t border-border pt-2 flex justify-between font-semibold text-base">
                <span className="text-text-primary">Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              <>Proceed to Checkout <ArrowRight size={16} /></>
            </button>

            <Link href="/shop" className="block text-center text-sm text-text-muted hover:text-text-secondary transition-colors">
              ← Continue Shopping
            </Link>

            <div className="border-t border-border pt-3 space-y-1.5 text-xs text-text-muted">
              <p>✓ Secure payment via Stripe</p>
              <p>✓ Card, FPX & GrabPay accepted</p>
              <p>✓ Free shipping on orders ≥ RM200</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
