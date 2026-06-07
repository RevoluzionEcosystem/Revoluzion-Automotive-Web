'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X, ShoppingCart, Package, Minus, Plus, Trash2, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/lib/shop/cart-context'
import { toast } from 'sonner'

interface Props { open: boolean; onClose: () => void }

export function CartDrawer({ open, onClose }: Props) {
  const { items, totalQty, subtotal, removeItem, updateQty, clearCart } = useCart()
  const router = useRouter()
  const overlayRef = useRef<HTMLDivElement>(null)

  const shippingFee = subtotal >= 200 ? 0 : 8.90
  const total = subtotal + shippingFee

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function handleCheckout() {
    if (items.length === 0) return
    onClose()
    router.push('/shop/pay')
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          ref={overlayRef}
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-105 bg-background border-l border-border z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="font-extrabold uppercase gradient-text flex items-center gap-2 text-sm" style={{ fontFamily: 'var(--font-orbitron)' }}>
            <ShoppingCart size={15} /> Cart {totalQty > 0 && <span className="text-text-muted normal-case font-normal">({totalQty})</span>}
          </h2>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <button onClick={() => { clearCart(); toast.success('Cart cleared') }} className="text-xs text-red-400 hover:text-red-300 transition-colors">Clear all</button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-variant transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
            <ShoppingCart size={48} className="text-primary/15" />
            <p className="text-text-secondary font-medium">Your cart is empty</p>
            <p className="text-text-muted text-sm">Browse the shop and add items.</p>
            <button onClick={onClose} className="mt-2 text-primary text-sm hover:underline">Continue Shopping</button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-3 p-4">
                <Link href={`/shop/${item.productId}`} onClick={onClose} className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-surface-variant flex items-center justify-center">
                  {item.imageUrl
                    ? <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="w-full h-full object-cover" />
                    : <Package size={20} className="text-primary/20" />}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/shop/${item.productId}`} onClick={onClose}>
                    <p className="text-sm font-medium text-text-primary line-clamp-2 hover:text-primary transition-colors">{item.name}</p>
                  </Link>
                  <p className="text-xs text-text-muted mt-0.5">{item.sku}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5 bg-surface-variant rounded-lg px-1.5 py-1">
                      <button onClick={() => { updateQty(item.productId, item.quantity - 1) }} disabled={item.quantity <= 1}
                        className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors">
                        <Minus size={10} />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => {
                          const v = parseInt(e.target.value)
                          if (!isNaN(v) && v >= 1) updateQty(item.productId, v)
                        }}
                        className="text-xs font-medium w-7 text-center bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button onClick={() => { updateQty(item.productId, item.quantity + 1); toast.success('Quantity updated') }}
                        className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
                        <Plus size={10} />
                      </button>
                    </div>
                    <span className="price-srp text-sm">{formatCurrency(item.priceSnapshot * item.quantity)}</span>
                    <button onClick={() => { removeItem(item.productId); toast.success(`${item.name} removed`) }} className="p-1 text-text-muted hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-5 space-y-3 shrink-0">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-text-secondary"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-text-secondary">
                <span>Shipping</span>
                <span className={shippingFee === 0 ? 'text-green-400' : ''}>{shippingFee === 0 ? 'FREE' : formatCurrency(shippingFee)}</span>
              </div>
              {shippingFee > 0 && <p className="text-[11px] text-text-muted">Add {formatCurrency(200 - subtotal)} more for free shipping</p>}
              <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
                <span>Total</span><span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
            <button onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors">
              <>Checkout <ArrowRight size={16} /></>
            </button>
            <Link href="/shop/cart" onClick={onClose} className="block text-center text-xs text-text-muted hover:text-primary transition-colors">
              View full cart
            </Link>
          </div>
        )}
      </div>
    </>
  )
}