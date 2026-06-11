'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/lib/shop/cart-context'
import { formatCurrency } from '@/lib/utils'
import { MapPin, Plus, Check, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

const MY_STATES = ['Johor','Kedah','Kelantan','Kuala Lumpur','Labuan','Melaka','Negeri Sembilan','Pahang','Penang','Perak','Perlis','Putrajaya','Sabah','Sarawak','Selangor','Terengganu']

interface Address {
  id: string; name: string; phone: string; line1: string; line2: string | null
  city: string; state: string; postcode: string; is_default: boolean; label: string | null
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const router = useRouter()
  const supabase = createClient()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const shippingFee = subtotal >= 200 ? 0 : 8.90
  const total = subtotal + shippingFee

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login?redirect=/shop/checkout'); return }
      setUserId(user.id)
      supabase.from('user_addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false })
        .then(({ data }) => {
          const addrs = (data ?? []) as Address[]
          setAddresses(addrs)
          const def = addrs.find((a) => a.is_default) ?? addrs[0]
          if (def) setSelectedId(def.id)
          else setShowForm(true)
        })
    })
  }, []) // eslint-disable-line

  async function saveAddress(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const body = {
      user_id: userId,
      name: fd.get('name') as string,
      phone: fd.get('phone') as string,
      line1: fd.get('line1') as string,
      line2: (fd.get('line2') as string) || null,
      city: fd.get('city') as string,
      state: fd.get('state') as string,
      postcode: fd.get('postcode') as string,
      label: (fd.get('label') as string) || null,
      is_default: addresses.length === 0,
    }
    const { data, error } = await supabase.from('user_addresses').insert(body).select('*').single()
    setSaving(false)
    if (error) { toast.error('Failed to save address'); return }
    const newAddr = data as Address
    setAddresses((prev) => [...prev, newAddr])
    setSelectedId(newAddr.id)
    setShowForm(false)
    toast.success('Address saved')
  }

  async function handleCheckout() {
    if (!selectedId || items.length === 0) return
    const addr = addresses.find((a) => a.id === selectedId)
    if (!addr) return
    setCheckingOut(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })), addressId: selectedId }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Checkout failed'); return }
      if (data.url && typeof window !== 'undefined') window.location.href = data.url
    } catch { toast.error('Network error') }
    finally { setCheckingOut(false) }
  }

  if (items.length === 0) {
    router.push('/shop')
    return null
  }

  const inputCls = 'w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black uppercase gradient-text mb-8" style={{ fontFamily: 'var(--font-orbitron)' }}>Checkout</h1>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: address */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-black uppercase gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>
              <MapPin size={14} className="inline mr-1.5" />Delivery Address
            </h2>
            {addresses.length > 0 && !showForm && (
              <button onClick={() => setShowForm(true)} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Plus size={11} /> Add new
              </button>
            )}
          </div>

          {addresses.map((addr) => (
            <button key={addr.id} onClick={() => setSelectedId(addr.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${selectedId === addr.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  {addr.label && <span className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1 block">{addr.label}</span>}
                  <p className="font-semibold text-sm text-text-primary">{addr.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">{addr.phone}</p>
                  <p className="text-xs text-text-secondary mt-1">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.postcode} {addr.city}, {addr.state}</p>
                </div>
                {selectedId === addr.id && <Check size={16} className="text-primary shrink-0 mt-0.5" />}
              </div>
            </button>
          ))}

          {showForm && (
            <form onSubmit={saveAddress} className="space-y-3 bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">New Address</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="text-xs text-text-muted mb-1 block">Full Name *</label><input name="name" required className={inputCls} /></div>
                <div className="col-span-2"><label className="text-xs text-text-muted mb-1 block">Phone *</label><input name="phone" required className={inputCls} /></div>
                <div className="col-span-2"><label className="text-xs text-text-muted mb-1 block">Address Line 1 *</label><input name="line1" required className={inputCls} /></div>
                <div className="col-span-2"><label className="text-xs text-text-muted mb-1 block">Address Line 2</label><input name="line2" className={inputCls} /></div>
                <div><label className="text-xs text-text-muted mb-1 block">City *</label><input name="city" required className={inputCls} /></div>
                <div><label className="text-xs text-text-muted mb-1 block">Postcode *</label><input name="postcode" required className={inputCls} /></div>
                <div className="col-span-2"><label className="text-xs text-text-muted mb-1 block">State *</label>
                  <select name="state" required className={inputCls}>
                    <option value="">Select state</option>
                    {MY_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2"><label className="text-xs text-text-muted mb-1 block">Label (e.g. Home, Office)</label><input name="label" className={inputCls} /></div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save Address'}
                </button>
                {addresses.length > 0 && <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-4 py-2.5 text-sm">Cancel</button>}
              </div>
            </form>
          )}
        </div>

        {/* Right: order summary */}
        <div className="lg:col-span-2">
          <div className="card p-5 space-y-4 sticky top-20">
            <h2 className="text-sm font-black uppercase gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>Order Summary</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-xs text-text-secondary gap-2">
                  <span className="truncate">{item.name} ×{item.quantity}</span>
                  <span className="shrink-0 font-medium">{formatCurrency(item.priceSnapshot * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-border space-y-1.5 text-sm">
              <div className="flex justify-between text-text-secondary"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-text-secondary"><span>Shipping</span><span className={shippingFee === 0 ? 'text-green-400' : ''}>{shippingFee === 0 ? 'FREE' : formatCurrency(shippingFee)}</span></div>
              <div className="flex justify-between font-bold text-base pt-1 border-t border-border"><span>Total</span><span className="text-primary">{formatCurrency(total)}</span></div>
            </div>
            <button onClick={handleCheckout} disabled={checkingOut || !selectedId}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {checkingOut ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : <>Pay {formatCurrency(total)} <ArrowRight size={16} /></>}
            </button>
            <p className="text-[11px] text-text-muted text-center">Secured by Stripe · Card, FPX, GrabPay</p>
          </div>
        </div>
      </div>
    </div>
  )
}