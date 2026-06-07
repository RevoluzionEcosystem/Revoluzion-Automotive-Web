'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Package, ShoppingCart, ArrowRight, Minus, Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/lib/shop/cart-context'

export function CartSidebar() {
  const { items, totalQty, subtotal, removeItem, updateQty } = useCart()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h2
          className="text-[11px] font-extrabold uppercase tracking-widest gradient-text flex items-center gap-2"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          <ShoppingCart size={13} />
          Cart
          {totalQty > 0 && (
            <span className="text-text-muted font-normal normal-case text-[11px]">({totalQty})</span>
          )}
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-2">
          <ShoppingCart size={36} className="text-primary/15" />
          <p className="text-sm text-text-muted">Cart is empty</p>
          <Link href="/shop" className="text-xs text-primary hover:underline mt-1">
            Browse products
          </Link>
        </div>
      ) : (
        <>
          {/* Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {items.map((item) => (
              <div key={item.productId} className="p-3 flex gap-2.5">
                <Link
                  href={`/shop/${item.productId}`}
                  className="w-11 h-11 rounded-lg overflow-hidden bg-surface-variant shrink-0 flex items-center justify-center"
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={44}
                      height={44}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package size={14} className="text-primary/20" />
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary line-clamp-2 leading-snug">
                    {item.name}
                  </p>
                  <p className="text-primary text-xs font-semibold mt-0.5">
                    {formatCurrency(item.priceSnapshot)}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <button
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-5 h-5 rounded bg-surface-variant flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
                    >
                      <Minus size={9} />
                    </button>
                    <span className="text-xs w-5 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.productId, item.quantity + 1)}
                      className="w-5 h-5 rounded bg-surface-variant flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                    >
                      <Plus size={9} />
                    </button>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="ml-auto text-text-muted hover:text-red-400 transition-colors p-0.5"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border shrink-0 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-muted">Subtotal</span>
              <span className="text-primary font-bold text-base">{formatCurrency(subtotal)}</span>
            </div>
            {subtotal < 200 && (
              <p className="text-[11px] text-text-muted">
                Add {formatCurrency(200 - subtotal)} more for free shipping
              </p>
            )}
            {subtotal >= 200 && (
              <p className="text-[11px] text-green-400">Free shipping applied!</p>
            )}
            <Link
              href="/shop/cart"
              className="flex items-center justify-center gap-2 py-2.5 bg-primary text-black font-semibold rounded-xl text-sm hover:bg-primary/90 transition-colors w-full"
            >
              Checkout <ArrowRight size={14} />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}