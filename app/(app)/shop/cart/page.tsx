'use client'

import { useState } from 'react'
import { ShoppingCart, Trash2, Package, ArrowRight, CreditCard } from 'lucide-react'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'

// Simple client-side cart using useState (in a real app this would use Zustand/context)
const INITIAL_DEMO_ITEMS = [
  { id: '1', name: 'Revoluzion Classic Tee', price: 59.90, qty: 1, image_url: null },
  { id: '4', name: 'Sticker Pack Vol.1', price: 19.90, qty: 2, image_url: null },
]

export default function CartPage() {
  const [items, setItems] = useState(INITIAL_DEMO_ITEMS)
  const [checkingOut, setCheckingOut] = useState(false)

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const shipping = total > 100 ? 0 : 8.90

  function updateQty(id: string, delta: number) {
    setItems((prev) =>
      prev.map((item) => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item)
    )
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  async function handleCheckout() {
    setCheckingOut(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            name: i.name,
            price: Math.round(i.price * 100), // cents
            quantity: i.qty,
          })),
        }),
      })

      if (!res.ok) throw new Error('Checkout failed')
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      toast.error('Checkout unavailable. Please try again.')
    } finally {
      setCheckingOut(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShoppingCart size={48} className="mx-auto mb-4 text-text-muted opacity-30" />
        <h1 className="text-xl font-bold gradient-text mb-2" style={{ fontFamily: 'var(--font-orbitron)' }}>Your cart is empty</h1>
        <p className="text-text-muted mb-6">Add some items from the shop to get started</p>
        <Link href="/shop" className="btn-primary inline-flex items-center gap-2">
          Browse Shop <ArrowRight size={16} />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold gradient-text mb-6 flex items-center gap-2" style={{ fontFamily: 'var(--font-orbitron)' }}>
        <ShoppingCart size={22} /> Cart ({items.reduce((n, i) => n + i.qty, 0)} items)
      </h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="card p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-surface-variant border border-border overflow-hidden shrink-0 flex items-center justify-center">
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.name} width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                  <Package size={20} className="text-primary/30" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-text-primary text-sm">{item.name}</div>
                <div className="text-primary font-bold mt-0.5">{formatCurrency(item.price)}</div>
              </div>

              {/* Qty */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQty(item.id, -1)}
                  className="w-7 h-7 rounded-lg bg-surface-variant border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-primary/50 transition-colors"
                >
                  −
                </button>
                <span className="w-6 text-center text-text-primary font-medium text-sm">{item.qty}</span>
                <button
                  onClick={() => updateQty(item.id, 1)}
                  className="w-7 h-7 rounded-lg bg-surface-variant border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-primary/50 transition-colors"
                >
                  +
                </button>
              </div>

              <div className="text-text-primary font-bold text-sm min-w-[60px] text-right">
                {formatCurrency(item.price * item.qty)}
              </div>

              <button
                onClick={() => removeItem(item.id)}
                className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div>
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-text-primary">Order Summary</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-success">Free</span> : formatCurrency(shipping)}</span>
              </div>
              {shipping > 0 && (
                <p className="text-text-muted text-xs">Free shipping on orders over {formatCurrency(100)}</p>
              )}
            </div>

            <div className="pt-3 border-t border-border flex justify-between">
              <span className="font-bold text-text-primary">Total</span>
              <span className="font-bold text-primary text-lg">{formatCurrency(total + shipping)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base"
            >
              <CreditCard size={18} />
              {checkingOut ? 'Processing...' : 'Checkout with Stripe'}
            </button>

            <p className="text-text-muted text-xs text-center">
              Secured by Stripe. We accept Visa, Mastercard, FPX & more.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
