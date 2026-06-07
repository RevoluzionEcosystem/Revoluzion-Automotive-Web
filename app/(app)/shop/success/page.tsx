import Link from 'next/link'
import { CheckCircle, ShoppingBag, Package, XCircle, ShoppingCart } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { formatCurrency } from '@/lib/utils'
import { ClearCartOnSuccess } from '@/components/shop/ClearCartOnSuccess'
import { fulfillCheckout } from '@/app/api/stripe/webhook/route'

export const metadata: Metadata = { title: 'Order Status' }
export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ session_id?: string; order_id?: string }>
}

export default async function ShopSuccessPage({ searchParams }: Props) {
  const { session_id, order_id } = await searchParams

  // ── Check Stripe session status ──────────────────────────────────────
  let stripeStatus: 'complete' | 'open' | 'expired' | null = null
  let stripePaymentStatus: 'paid' | 'unpaid' | 'no_payment_required' | null = null

  if (session_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      const session = await stripe.checkout.sessions.retrieve(session_id)
      stripeStatus = session.status as typeof stripeStatus
      stripePaymentStatus = session.payment_status as typeof stripePaymentStatus
    } catch (err) {
      console.error('[Success page] Stripe session retrieve error:', err)
    }
  }

  // ── Payment not completed — show cancellation page ───────────────────
  const paymentFailed = stripePaymentStatus === 'unpaid' || stripeStatus === 'expired'

  if (paymentFailed) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <XCircle size={40} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-bold gradient-text mb-3" style={{ fontFamily: 'var(--font-orbitron)' }}>
          Payment Incomplete
        </h1>
        <p className="text-text-secondary text-sm mb-2">
          Your payment was not completed. Your order has not been placed and you have not been charged.
        </p>
        <p className="text-text-muted text-xs mb-8">
          Your cart items are still saved. You can try again whenever you&apos;re ready.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/shop/pay" className="btn-primary flex items-center justify-center gap-2">
            <ShoppingCart size={16} /> Try Again
          </Link>
          <Link href="/shop/cart" className="btn-secondary flex items-center justify-center gap-2">
            <ShoppingBag size={16} /> Back to Cart
          </Link>
        </div>
      </div>
    )
  }

  // ── Payment succeeded — trigger fulfillment ──────────────────────────
  if (session_id) {
    try {
      await fulfillCheckout(session_id)
    } catch (err) {
      console.error('[Success page] fulfillCheckout error:', err)
    }
  }

  let orderNumber: string | null = null
  let total: number | null = null

  if (order_id) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('orders')
        .select('order_number, total')
        .eq('id', order_id)
        .eq('user_id', user.id)
        .single()
      if (data) { orderNumber = data.order_number; total = data.total }
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <ClearCartOnSuccess />
      <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-green-400" />
      </div>
      <h1 className="text-2xl font-bold gradient-text mb-3" style={{ fontFamily: 'var(--font-orbitron)' }}>
        Order Confirmed!
      </h1>
      {orderNumber && (
        <p className="text-text-muted text-sm mb-1">
          Order <span className="text-text-primary font-mono">{orderNumber}</span>
        </p>
      )}
      {total !== null && (
        <p className="text-primary font-bold text-xl mb-4">{formatCurrency(total)}</p>
      )}
      <p className="text-text-secondary text-sm mb-2">
        Thank you for your purchase. We&apos;ve received your order and will process it shortly.
      </p>
      <p className="text-text-muted text-xs mb-8">
        A confirmation email will be sent to your registered email address.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {order_id ? (
          <Link href={`/shop/orders/${order_id}`} className="btn-primary flex items-center justify-center gap-2">
            <Package size={16} /> View Order
          </Link>
        ) : (
          <Link href="/shop/orders" className="btn-primary flex items-center justify-center gap-2">
            <Package size={16} /> Order History
          </Link>
        )}
        <Link href="/shop" className="btn-secondary flex items-center justify-center gap-2">
          <ShoppingBag size={16} /> Continue Shopping
        </Link>
      </div>
    </div>
  )
}