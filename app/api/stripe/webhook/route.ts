import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

// ── Idempotent fulfillment function ────────────────────────────────────────
// Called from both the webhook AND the return page — safe to run multiple times.
export async function fulfillCheckout(sessionId: string) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return

  const stripe = new Stripe(secretKey)
  const db = createAdminClient()

  // Retrieve the session with line_items expanded
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items'],
  })

  // Only fulfill paid sessions
  const sessionObj: any = session
  if (sessionObj.payment_status === 'unpaid') return

  const orderId = sessionObj.metadata?.orderId
  if (!orderId) return

  // ── Idempotency check: skip if already fulfilled ───────────────────────
  const { data: order } = await db
    .from('orders')
    .select('order_status, payment_status')
    .eq('id', orderId)
    .single()

  if (!order) return
  // Already fulfilled — don't process twice
  if (order.order_status !== 'PENDING_PAYMENT') return

  // ── Fill delivery address from Stripe ────────────────────────────────
  const addr = sessionObj.shipping_details?.address
  const name = sessionObj.shipping_details?.name ?? sessionObj.customer_details?.name ?? ''
  const phone = sessionObj.customer_details?.phone ?? ''

  await db.from('orders').update({
    order_status: 'PAID',
    payment_status: 'COMPLETED',
    payment_method: 'STRIPE_CARD',
    stripe_payment_intent_id: (sessionObj.payment_intent as string) ?? null,
    paid_at: new Date().toISOString(),
    delivery_name: name,
    delivery_phone: phone,
    delivery_line1: addr?.line1 ?? '',
    delivery_line2: addr?.line2 ?? null,
    delivery_city: addr?.city ?? '',
    delivery_state: addr?.state ?? '',
    delivery_postcode: addr?.postal_code ?? '',
  }).eq('id', orderId)

  // ── Decrement stock ───────────────────────────────────────────────────
  const { data: orderItems } = await db
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId)

  if (orderItems) {
    for (const item of orderItems) {
      const { data: prod } = await db
        .from('products')
        .select('stock_qty')
        .eq('id', item.product_id)
        .single()
      if (prod) {
        await db.from('products')
          .update({ stock_qty: Math.max(0, prod.stock_qty - item.quantity) })
          .eq('id', item.product_id)
      }
    }
  }

  // ── Clear the user's cart ─────────────────────────────────────────────
  const { data: orderData } = await db.from('orders').select('user_id, order_number, total, subtotal, shipping_fee').eq('id', orderId).single()
  if (orderData?.user_id) {
    const { data: cart } = await db.from('carts').select('id').eq('user_id', orderData.user_id).maybeSingle()
    if (cart) await db.from('cart_items').delete().eq('cart_id', cart.id)
  }

  // Try to read customer's company name from users
  let customerCompany: string | null = null
  if (orderData?.user_id) {
    try {
      const { data: profile } = await db.from('users').select('company_name').eq('id', orderData.user_id).single()
      customerCompany = (profile as any)?.company_name ?? null
    } catch (e) {
      // non-fatal
    }
  }

  // ── Auto-create sales invoice ────────────────────────────────────────
  // Check if invoice already exists for this order
  const { data: existingInvoice } = await db.from('sales_invoices').select('id').eq('order_id', orderId).maybeSingle()
  if (!existingInvoice) {
    const invoiceNumber = `INV-${(orderData?.order_number ?? orderId).replace('RA-', '')}`
    const customerEmail = sessionObj.customer_details?.email ?? ''
    const customerName = sessionObj.shipping_details?.name ?? sessionObj.customer_details?.name ?? ''
    const now = new Date().toISOString()
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

    await db.from('sales_invoices').insert({
      invoice_number: invoiceNumber,
      order_id: orderId,
      customer_name: customerName,
      customer_company: customerCompany,
      profile_id: orderData?.user_id ?? null,
      customer_email: customerEmail,
      total: orderData?.total ?? 0,
      status: 'PAID',
      issue_date: now,
      due_date: dueDate,
      paid_at: now,
    })
    console.log('[Stripe] Sales invoice created:', invoiceNumber)

      // Auto-post SALE journal for this paid invoice (idempotent by reference)
      try {
        const invoiceRef = invoiceNumber
        const { data: existingJournal } = await db
          .from('journals')
          .select('id')
          .eq('reference', invoiceRef)
          .eq('type', 'SALE')
          .limit(1)

        if (!existingJournal || (Array.isArray(existingJournal) && existingJournal.length === 0)) {
          const today = new Date().toISOString().slice(0, 10)
          const { data: journal, error: jErr } = await db
            .from('journals')
            .insert({ date: today, description: `Invoice payment received: ${invoiceRef}`, type: 'SALE', reference: invoiceRef })
            .select('id')
            .single()

          if (jErr || !journal) {
            console.error('[Stripe] Failed to create journal header for invoice', invoiceRef, jErr)
          } else {
            const entryRows = [
              { journal_id: journal.id, account_code: '1200', debit: Number(orderData?.total ?? 0), credit: 0, description: 'Accounts Receivable', sort_order: 0 },
              { journal_id: journal.id, account_code: '4100', debit: 0, credit: Number(orderData?.total ?? 0), description: 'Sales Revenue', sort_order: 1 },
            ]

            const { error: eErr } = await db.from('journal_entries').insert(entryRows)
            if (eErr) {
              // Roll back journal header on failure to insert lines
              await db.from('journals').delete().eq('id', journal.id)
              console.error('[Stripe] Failed to insert journal entries for invoice', invoiceRef, eErr)
            } else {
              console.log('[Stripe] Sale journal posted for invoice', invoiceRef)
            }
          }
        } else {
          console.log('[Stripe] Sale journal already exists for invoice', invoiceRef)
        }
      } catch (e) {
        console.error('[Stripe] Error while posting sale journal for invoice', invoiceNumber, e)
      }
  }

  console.log('[Stripe] Order fulfilled:', orderId)
}

// ── Webhook endpoint ────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secretKey || !webhookSecret)
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })

  const stripe = new Stripe(secretKey)
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  const allowInsecure = process.env.ALLOW_INSECURE_WEBHOOK === '1'

  let event: Stripe.Event
  if (!signature) {
    if (allowInsecure && process.env.NODE_ENV !== 'production') {
      try {
        // DEV fallback: parse payload without verification when explicitly enabled
        // Useful for local testing when Stripe CLI isn't available.
        // DO NOT enable in production.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        event = JSON.parse(body) as Stripe.Event
        console.warn('ALLOW_INSECURE_WEBHOOK=1 — proceeding without signature verification')
      } catch (e) {
        return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }
  } else {
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch {
      return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 })
    }
  }

  const db = createAdminClient()

  switch (event.type) {
    // Immediate payment (card, GrabPay)
    case 'checkout.session.completed':
    // Delayed payment completed (FPX bank transfer etc.)
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session
      await fulfillCheckout(session.id)
      break
    }

    // Delayed payment failed (e.g. FPX transfer bounced)
    case 'checkout.session.async_payment_failed': {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = session.metadata?.orderId
      if (orderId) {
        await db.from('orders')
          .update({ order_status: 'CANCELLED', payment_status: 'FAILED' })
          .eq('id', orderId)
          .eq('order_status', 'PENDING_PAYMENT')
        console.log('[Stripe] Async payment failed, order cancelled:', orderId)
      }
      break
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = session.metadata?.orderId
      if (orderId) {
        await db.from('orders')
          .update({ order_status: 'CANCELLED', payment_status: 'EXPIRED' })
          .eq('id', orderId)
          .eq('order_status', 'PENDING_PAYMENT')
      }
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}