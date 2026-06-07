'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/lib/shop/cart-context'
import { CartDrawer } from './CartDrawer'

export function CartMiniCard() {
  const { totalQty, subtotal } = useCart()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 bg-surface border border-border hover:border-primary/40 rounded-xl px-4 py-2.5 transition-colors group"
      >
        <div className="relative">
          <ShoppingCart size={18} className="text-text-secondary group-hover:text-primary transition-colors" />
          {totalQty > 0 && (
            <span className="absolute -top-2 -right-2 w-4 h-4 bg-primary text-black text-[9px] font-bold rounded-full flex items-center justify-center">
              {totalQty > 9 ? '9+' : totalQty}
            </span>
          )}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-[10px] text-text-muted leading-none mb-0.5">{totalQty} item{totalQty !== 1 ? 's' : ''}</p>
          <p className="text-sm font-bold text-primary leading-none">{formatCurrency(subtotal)}</p>
        </div>
      </button>
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}