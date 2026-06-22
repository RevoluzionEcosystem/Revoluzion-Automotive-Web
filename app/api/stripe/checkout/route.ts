import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })

  const stripe = new Stripe(secretKey)
  const origin = request.headers.get('origin') ?? 'https://revoluzion.my'

  try {
    const body = await request.json() as { items: { productId: string; quantity: number }[]; addressId?: string }
    const { items, addressId } = body

    if (!Array.isArray(items) || items.length === 0)
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })

    // ── 1. Re-fetch prices from DB (never trust client) ──────────────────
    const db = createAdminClient()
    const productIds = items.map((i) => i.productId)
    const { data: products, error: prodErr } = await db
      .from('products')
      .select('id, name, sku_public, price_retail, stock_qty, is_published, is_deleted, product_images(url, sort_order)')
      .in('id', productIds)
      .eq('is_published', true)
      .eq('is_deleted', false)

    if (prodErr || !products?.length)
      return NextResponse.json({ error: 'Products not found' }, { status: 404 })

    // Build verified line items
    type VerifiedItem = {
      productId: string; name: string; sku: string; priceRetail: number
      quantity: number; unitAmountSen: number; subtotal: number; imageUrl: string | null
    }
    const verified: VerifiedItem[] = []
    for (const { productId, quantity } of items) {
      const p = products.find((x) => x.id === productId)
      if (!p) return NextResponse.json({ error: `Product ${productId} not found` }, { status: 404 })
      if (p.stock_qty < quantity)
        return NextResponse.json({ error: `${p.name} has insufficient stock` }, { status: 409 })
      const imgs = (p.product_images as { url: string; sort_order: number }[] ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
      verified.push({
        productId,
        name: p.name,
        sku: p.sku_public,
        priceRetail: p.price_retail,
        quantity,
        unitAmountSen: Math.round(p.price_retail * 100),
        subtotal: Math.round(p.price_retail * quantity * 100) / 100,
        imageUrl: imgs[0]?.url ?? null,
      })
    }

    const subtotal = verified.reduce((s, i) => s + i.subtotal, 0)
    const shippingFee = subtotal >= 200 ? 0 : 8.90
    const total = subtotal + shippingFee

    // ── 2. Get current user + selected address ───────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch the chosen address from DB
    let address: {
      name: string; phone: string; line1: string; line2: string | null
      city: string; state: string; postcode: string
    } | null = null
    if (addressId && user) {
      const { data: addr } = await db
        .from('user_addresses')
        .select('name, phone, line1, line2, city, state, postcode')
        .eq('id', addressId)
        .eq('user_id', user.id)
        .single()
      address = addr ?? null
    }

    // ── 3. Create or retrieve Stripe Customer with shipping pre-filled ───
    let stripeCustomerId: string | undefined
    if (user) {
      // Check if user already has a stripe_customer_id in users
      const { data: profile } = await db
        .from('users')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()

      const shipping = address ? {
        name: address.name,
        phone: address.phone,
        address: {
          line1: address.line1,
          line2: address.line2 ?? undefined,
          city: address.city,
          state: address.state,
          postal_code: address.postcode,
          country: 'MY',
        },
      } : undefined

      if (profile?.stripe_customer_id) {
        // Update existing customer shipping
        await stripe.customers.update(profile.stripe_customer_id, {
          email: user.email,
          name: address?.name,
          shipping,
        })
        stripeCustomerId = profile.stripe_customer_id
      } else {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: user.email,
          name: address?.name,
          shipping,
        })
        stripeCustomerId = customer.id
        // Persist for future checkouts (write to base table)
        await db.from('users').update({ stripe_customer_id: customer.id }).eq('id', user.id)
      }
    }

    // ── 4. Create pending order in Supabase ──────────────────────────────
    const orderNumber = `RA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const { data: order, error: orderErr } = await db
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user?.id ?? null,
        order_status: 'PENDING_PAYMENT',
        payment_status: 'PENDING',
        subtotal,
        shipping_fee: shippingFee,
        tax_amount: 0,
        total,
        // Pre-fill from selected address so webhook fallback has data
        delivery_name: address?.name ?? '',
        delivery_phone: address?.phone ?? '',
        delivery_line1: address?.line1 ?? '',
        delivery_line2: address?.line2 ?? null,
        delivery_city: address?.city ?? '',
        delivery_state: address?.state ?? '',
        delivery_postcode: address?.postcode ?? '',
      })
      .select('id')
      .single()

    if (orderErr || !order) {
      console.error('[Checkout] Order creation failed:', orderErr)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // ── 4. Create order_items ────────────────────────────────────────────
    await db.from('order_items').insert(
      verified.map((i) => ({
        order_id: order.id,
        product_id: i.productId,
        sku: i.sku,
        name: i.name,
        quantity: i.quantity,
        unit_price: i.priceRetail,
        subtotal: i.subtotal,
        image_url: i.imageUrl,
      }))
    )

    // ── 5. Create Stripe Embedded Checkout Session ──────────────────────
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded_page',
      payment_method_types: ['card', 'fpx', 'grabpay'],
      mode: 'payment',
      line_items: verified.map((i) => ({
        price_data: {
          currency: 'myr',
          product_data: {
            name: i.name,
            ...(i.imageUrl ? { images: [i.imageUrl] } : {}),
          },
          unit_amount: i.unitAmountSen,
        },
        quantity: i.quantity,
      })),
      shipping_address_collection: { allowed_countries: ['MY'] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: Math.round(shippingFee * 100), currency: 'myr' },
            display_name: shippingFee === 0 ? 'Free Shipping' : 'Standard Shipping',
          },
        },
      ],
      metadata: { orderId: order.id, orderNumber },
      // Attach Stripe customer — autofills shipping form from saved address
      ...(stripeCustomerId ? { customer: stripeCustomerId } : { customer_email: user?.email ?? undefined }),
      return_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
    })

    return NextResponse.json({ clientSecret: session.client_secret })
  } catch (error) {
    console.error('[Stripe Checkout]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

