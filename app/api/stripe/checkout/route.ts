import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }
  const stripe = new Stripe(secretKey)

  try {
    const { items } = await request.json()

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    const line_items = items.map((item: { name: string; price: number; quantity: number }) => ({
      price_data: {
        currency: 'myr',
        product_data: { name: item.name },
        unit_amount: item.price, // already in cents
      },
      quantity: item.quantity,
    }))

    const origin = request.headers.get('origin') ?? 'https://revoluzion.my'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop/cart`,
      metadata: { source: 'revoluzion-web' },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[Stripe Checkout]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
