import Link from 'next/link'
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Order Confirmed' }

export default function ShopSuccessPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-success" />
      </div>
      <h1 className="text-2xl font-bold gradient-text mb-3" style={{ fontFamily: 'var(--font-orbitron)' }}>Order Confirmed!</h1>
      <p className="text-text-secondary mb-2">
        Thank you for your purchase. We&apos;ve received your order and will process it shortly.
      </p>
      <p className="text-text-muted text-sm mb-8">
        A confirmation email will be sent to your registered email address.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/shop" className="btn-primary flex items-center justify-center gap-2">
          <ShoppingBag size={16} /> Continue Shopping
        </Link>
        <Link href="/feed" className="btn-secondary flex items-center justify-center gap-2">
          Go to Feed <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}
