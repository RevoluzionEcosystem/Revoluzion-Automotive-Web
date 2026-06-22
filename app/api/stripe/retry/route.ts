import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })

  const stripe = new Stripe(secretKey)
  const origin = request.headers.get('origin') ?? 'https://revoluzion.my'
  const db = createAdminClient()

  try {
    const { orderId } = await request.json() as { orderId: string }
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

    // Auth check — only the order owner can retry
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch the order
    const { data: order } = await db
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.order_status !== 'PENDING_PAYMENT') {
      return NextResponse.json({ error: 'Order is not pending payment' }, { status: 409 })
    }

    // Get Stripe customer for address autofill
    const { data: profile } = await db.from('users').select('stripe_customer_id').eq('id', user.id).single()

    // Build line items from stored order items
    const lineItems = (order.order_items ?? []).map((item: any) => ({
      price_data: {
        currency: 'myr',
        product_data: { name: item.name },
        unit_amount: Math.round(item.unit_price * 100),
      },
      quantity: item.quantity,
    }))

    if (lineItems.length === 0) return NextResponse.json({ error: 'No items in order' }, { status: 400 })

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded_page',
      payment_method_types: ['card', 'fpx', 'grabpay'],
      mode: 'payment',
      line_items: lineItems,
      shipping_address_collection: { allowed_countries: ['MY'] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: Math.round(order.shipping_fee * 100), currency: 'myr' },
            display_name: order.shipping_fee === 0 ? 'Free Shipping' : 'Standard Shipping',
          },
        },
      ],
      metadata: { orderId: order.id, orderNumber: order.order_number },
      ...(profile?.stripe_customer_id
        ? { customer: profile.stripe_customer_id }
        : { customer_email: user.email ?? undefined }),
      return_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
    })

    return NextResponse.json({ clientSecret: session.client_secret })
  } catch (error) {
    console.error('[Stripe Retry]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}