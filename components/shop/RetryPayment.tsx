'use client'

import { useMemo, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { CreditCard, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function RetryPayment({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleOpen() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { toast.error(data.error ?? 'Failed to start payment'); return }
      setClientSecret(data.clientSecret)
      setOpen(true)
    } catch { toast.error('Network error') }
    finally { setLoading(false) }
  }

  const fn = useMemo(
    () => clientSecret ? () => Promise.resolve(clientSecret) : null,
    [clientSecret]
  )

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {loading ? <><Loader2 size={16} className="animate-spin" /> Preparing…</> : <><CreditCard size={16} /> Pay Now</>}
      </button>

      {/* Modal overlay with embedded checkout */}
      {open && fn && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="relative w-full max-w-2xl">
            <button
              onClick={() => { setOpen(false); setClientSecret(null) }}
              className="absolute -top-10 right-0 flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
            >
              <X size={16} /> Cancel
            </button>
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret: fn }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        </div>
      )}
    </>
  )
}