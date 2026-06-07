import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Package, ChevronRight, Clock } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Metadata } from 'next'
import type { Order } from '@/lib/shop/types'

export const metadata: Metadata = { title: 'Order History' }
export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: 'text-amber-400',
  PAID:            'text-blue-400',
  PROCESSING:      'text-blue-400',
  DISPATCHED:      'text-cyan-400',
  DELIVERED:       'text-cyan-400',
  COMPLETED:       'text-green-400',
  CANCELLED:       'text-red-400',
  REFUNDED:        'text-red-400',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Pending Payment',
  PAID:            'Paid',
  PROCESSING:      'Processing',
  DISPATCHED:      'Dispatched',
  DELIVERED:       'Delivered',
  COMPLETED:       'Completed',
  CANCELLED:       'Cancelled',
  REFUNDED:        'Refunded',
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/shop/orders')

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, order_status, payment_status, total, created_at, order_items(id, name, quantity, unit_price, image_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const typedOrders = (orders ?? []) as Order[]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>Order History</h1>
        <p className="text-text-muted text-sm mt-1">{typedOrders.length} orders</p>
      </div>

      {typedOrders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-primary/30" />
          </div>
          <p className="text-text-secondary font-medium mb-1">No orders yet</p>
          <p className="text-text-muted text-sm mb-6">Your purchase history will appear here.</p>
          <Link href="/shop" className="btn-primary inline-flex items-center gap-2">
            <Package size={16} /> Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {typedOrders.map((order) => {
            const firstItem = order.order_items?.[0]
            const itemCount = order.order_items?.reduce((s, i) => s + i.quantity, 0) ?? 0
            const statusColor = STATUS_STYLES[order.order_status] ?? 'text-text-muted'
            const statusLabel = STATUS_LABELS[order.order_status] ?? order.order_status

            return (
              <Link key={order.id} href={`/shop/orders/${order.id}`} className="card p-4 flex gap-4 items-center hover:border-primary/30 transition-colors group">
                {/* First item image */}
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-surface-variant shrink-0">
                  {firstItem?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={firstItem.image_url} alt={firstItem.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={20} className="text-primary/20" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-text-primary">{order.order_number}</span>
                    <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                  </div>
                  <p className="text-xs text-text-muted line-clamp-1">
                    {firstItem?.name}{itemCount > 1 ? ` + ${itemCount - 1} more` : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Clock size={10} /> {formatDate(order.created_at)}
                    </span>
                  </div>
                </div>

                {/* Total + arrow */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-primary font-semibold">{formatCurrency(order.total)}</span>
                  <ChevronRight size={16} className="text-text-muted group-hover:text-primary transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
