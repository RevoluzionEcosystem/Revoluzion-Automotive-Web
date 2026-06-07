import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Package, MapPin, Truck, CreditCard, CheckCircle, Clock, XCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Metadata } from 'next'
import type { Order } from '@/lib/shop/types'
import { RetryPayment } from '@/components/shop/RetryPayment'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Order ${id.slice(0, 8).toUpperCase()}` }
}

const STATUS_STEPS = ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'COMPLETED']

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'text-amber-400', icon: Clock },
  PAID:            { label: 'Paid',            color: 'text-blue-400',  icon: CreditCard },
  PROCESSING:      { label: 'Processing',      color: 'text-blue-400',  icon: Package },
  DISPATCHED:      { label: 'Dispatched',      color: 'text-cyan-400',  icon: Truck },
  DELIVERED:       { label: 'Delivered',       color: 'text-cyan-400',  icon: Truck },
  COMPLETED:       { label: 'Completed',       color: 'text-green-400', icon: CheckCircle },
  CANCELLED:       { label: 'Cancelled',       color: 'text-red-400',   icon: XCircle },
  REFUNDED:        { label: 'Refunded',        color: 'text-red-400',   icon: XCircle },
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/shop/orders')

  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!data) notFound()
  const order = data as Order

  const cfg = STATUS_CONFIG[order.order_status] ?? STATUS_CONFIG.PENDING_PAYMENT
  const StatusIcon = cfg.icon
  const stepIndex = STATUS_STEPS.indexOf(order.order_status)
  const isCancelledOrRefunded = ['CANCELLED', 'REFUNDED'].includes(order.order_status)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link href="/shop/orders" className="inline-flex items-center gap-2 text-text-muted hover:text-text-secondary text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Orders
      </Link>

      {/* Header */}
      <div className="card p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-text-muted text-xs mb-1">Order</p>
            <h1 className="text-xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>{order.order_number}</h1>
            <p className="text-text-muted text-xs mt-1 flex items-center gap-1">
              <Clock size={10} /> {formatDate(order.created_at, 'dd MMM yyyy, HH:mm')}
            </p>
          </div>
          <div className={`flex items-center gap-1.5 text-sm font-medium ${cfg.color}`}>
            <StatusIcon size={16} />
            {cfg.label}
          </div>
        </div>

        {/* Progress bar (only for non-cancelled) */}
        {!isCancelledOrRefunded && (
          <div className="mt-4">
            <div className="flex items-center gap-1">
              {STATUS_STEPS.map((step, i) => (
                <div
                  key={step}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${i <= stepIndex ? 'bg-primary' : 'bg-surface-variant'}`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-text-muted">
              <span>Order Placed</span>
              <span>Completed</span>
            </div>
          </div>
        )}
      </div>

      {/* Tracking */}
      {order.tracking_number && (
        <div className="card p-4 mb-4 flex items-center gap-3">
          <Truck size={18} className="text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium text-text-primary">{order.shipping_carrier ?? 'Courier'}</p>
            <p className="text-xs text-text-muted">Tracking: {order.tracking_number}</p>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="card mb-4">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="font-semibold text-text-primary text-sm">Items ({order.order_items.reduce((s, i) => s + i.quantity, 0)})</h2>
        </div>
        <div className="divide-y divide-border">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex gap-3 p-4">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-surface-variant shrink-0">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-primary/20" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {item.product_id ? (
                  <Link href={`/shop/${item.product_id}`} className="text-sm font-medium text-text-primary hover:text-primary transition-colors line-clamp-2">{item.name}</Link>
                ) : (
                  <p className="text-sm font-medium text-text-primary line-clamp-2">{item.name}</p>
                )}
                <p className="text-xs text-text-muted mt-0.5">{item.sku}</p>
                <p className="text-xs text-text-muted">×{item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-primary shrink-0">{formatCurrency(item.subtotal)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment summary */}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold text-text-primary text-sm mb-3">Payment</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-text-secondary"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
          <div className="flex justify-between text-text-secondary"><span>Shipping</span><span>{order.shipping_fee === 0 ? <span className="text-green-400">FREE</span> : formatCurrency(order.shipping_fee)}</span></div>
          {order.tax_amount > 0 && (
            <div className="flex justify-between text-text-secondary"><span>Tax</span><span>{formatCurrency(order.tax_amount)}</span></div>
          )}
          <div className="border-t border-border pt-2 flex justify-between font-semibold text-base">
            <span className="text-text-primary">Total</span>
            <span className="text-primary">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Delivery address */}
      {order.delivery_line1 && (
        <div className="card p-5">
          <h2 className="font-semibold text-text-primary text-sm mb-3 flex items-center gap-2">
            <MapPin size={14} className="text-primary" /> Delivery Address
          </h2>
          <div className="text-sm text-text-secondary space-y-0.5">
            <p className="font-medium text-text-primary">{order.delivery_name}</p>
            {order.delivery_phone && <p>{order.delivery_phone}</p>}
            <p>{order.delivery_line1}</p>
            {order.delivery_line2 && <p>{order.delivery_line2}</p>}
            <p>{order.delivery_postcode} {order.delivery_city}, {order.delivery_state}</p>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {order.order_status === 'PENDING_PAYMENT' && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-2">
            <p className="text-amber-400 text-sm font-medium mb-3">⚠ Payment not completed for this order.</p>
            <RetryPayment orderId={order.id} />
          </div>
        )}
        <Link href="/shop" className="btn-secondary w-full text-center block">Continue Shopping</Link>
      </div>
    </div>
  )
}
