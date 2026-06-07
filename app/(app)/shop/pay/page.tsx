'use client'

import { useEffect, useRef, useState, useMemo, Suspense } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { useCart } from '@/lib/shop/cart-context'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Loader2, MapPin, Phone, Plus, Trash2, User } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const MY_STATES = [
  'Johor','Kedah','Kelantan','Kuala Lumpur','Labuan','Melaka',
  'Negeri Sembilan','Pahang','Penang','Perak','Perlis','Putrajaya',
  'Sabah','Sarawak','Selangor','Terengganu',
]

const LABELS = ['Home', 'Work', 'Other']

interface Address {
  id: string
  user_id: string
  name: string
  phone: string
  line1: string
  line2: string | null
  city: string
  state: string
  postcode: string
  country: string
  label: string | null
  is_default: boolean
}

// Phone validation: Malaysian +60 format
function validateMYPhone(phone: string): string | null {
  const cleaned = phone.replace(/\s|-/g, '')
  if (!/^\+60[0-9]{8,10}$/.test(cleaned)) return 'Enter a valid Malaysian number (+60XXXXXXXXX)'
  return null
}

function formatPhone(raw: string): string {
  // Auto-prepend +60 if user types local format
  let v = raw.replace(/[^\d+]/g, '')
  if (v.startsWith('60')) v = '+' + v
  else if (v.startsWith('0')) v = '+6' + v
  else if (!v.startsWith('+60')) v = '+60' + v.replace(/^\+/, '')
  return v
}

// ── Address Form ─────────────────────────────────────────────────────────────
function AddressForm({
  onSaved,
  onCancel,
  userId,
  count,
}: {
  onSaved: (addr: Address) => void
  onCancel: () => void
  userId: string
  count: number
}) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    label: 'Home',
    name: '',
    phone: '+60',
    line1: '',
    line2: '',
    city: '',
    state: 'Selangor',
    postcode: '',
  })

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    const phoneErr = validateMYPhone(form.phone)
    if (phoneErr) e.phone = phoneErr
    if (!form.line1.trim()) e.line1 = 'Address Line 1 is required'
    if (!form.city.trim()) e.city = 'City is required'
    if (!form.postcode.trim() || !/^\d{5}$/.test(form.postcode)) e.postcode = 'Enter a valid 5-digit postcode'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('user_addresses')
      .insert({
        user_id: userId,
        name: form.name.trim(),
        phone: formatPhone(form.phone),
        line1: form.line1.trim(),
        line2: form.line2.trim() || null,
        city: form.city.trim(),
        state: form.state,
        postcode: form.postcode.trim(),
        country: 'MYS',
        label: form.label,
        is_default: count === 0,
      })
      .select('*')
      .single()
    setSaving(false)
    if (error) { toast.error('Failed to save address'); return }
    toast.success('Address saved')
    onSaved(data as Address)
  }

  const inputCls = (key: string) =>
    `w-full px-3 py-2.5 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${errors[key] ? 'border-red-500/60' : 'border-border focus:border-primary/50'}`

  return (
    <form onSubmit={handleSave} className="space-y-4 bg-card border border-border rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-text-primary">New Delivery Address</h3>

      {/* Label tabs */}
      <div className="flex gap-2">
        {LABELS.map(l => (
          <button key={l} type="button" onClick={() => set('label', l)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${form.label === l ? 'bg-primary text-black border-primary' : 'bg-surface border-border text-text-secondary hover:border-primary/40'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Name */}
      <div>
        <label className="text-xs text-text-muted mb-1 flex items-center gap-1"><User size={10} /> Full Name <span className="text-red-400">*</span></label>
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Name / Receiver Name " className={inputCls('name')} />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="text-xs text-text-muted mb-1 flex items-center gap-1"><Phone size={10} /> Phone Number <span className="text-red-400">*</span></label>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 bg-surface-variant border border-border rounded-xl px-3 py-2.5 text-sm text-text-muted shrink-0">
            🇲🇾 +60
          </div>
          <input
            value={form.phone.replace(/^\+60/, '')}
            onChange={e => set('phone', '+60' + e.target.value.replace(/[^\d]/g, ''))}
            placeholder="123456789"
            className={`flex-1 px-3 py-2.5 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${errors.phone ? 'border-red-500/60' : 'border-border focus:border-primary/50'}`}
            maxLength={11}
          />
        </div>
        {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
      </div>

      {/* Address */}
      <div>
        <label className="text-xs text-text-muted mb-1 flex items-center gap-1"><MapPin size={10} /> Address Line 1 <span className="text-red-400">*</span></label>
        <input value={form.line1} onChange={e => set('line1', e.target.value)} placeholder="Unit / Block / Street" className={inputCls('line1')} />
        {errors.line1 && <p className="text-red-400 text-xs mt-1">{errors.line1}</p>}
      </div>
      <div>
        <label className="text-xs text-text-muted mb-1 block">Address Line 2 (Optional)</label>
        <input value={form.line2} onChange={e => set('line2', e.target.value)} placeholder="Area / Building name" className={inputCls('line2')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-text-muted mb-1 block">City <span className="text-red-400">*</span></label>
          <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Shah Alam" className={inputCls('city')} />
          {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
        </div>
        <div>
          <label className="text-xs text-text-muted mb-1 block">Postcode <span className="text-red-400">*</span></label>
          <input value={form.postcode} onChange={e => set('postcode', e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="40150" className={inputCls('postcode')} maxLength={5} />
          {errors.postcode && <p className="text-red-400 text-xs mt-1">{errors.postcode}</p>}
        </div>
      </div>

      <div>
        <label className="text-xs text-text-muted mb-1 block">State <span className="text-red-400">*</span></label>
        <select value={form.state} onChange={e => set('state', e.target.value)} className={inputCls('state')}>
          {MY_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-black font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm">
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save Address'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2.5 border border-border rounded-xl text-sm hover:bg-surface-variant transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Address Step ──────────────────────────────────────────────────────────────
function AddressStep({
  userId,
  onContinue,
}: {
  userId: string
  onContinue: (addr: Address) => void
}) {
  const supabase = createClient()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('user_addresses').select('*').eq('user_id', userId).order('is_default', { ascending: false }).order('created_at')
      .then(({ data }) => {
        const addrs = (data ?? []) as Address[]
        setAddresses(addrs)
        const def = addrs.find(a => a.is_default) ?? addrs[0]
        if (def) setSelected(def.id)
        else setShowForm(true)
        setLoading(false)
      })
  }, [userId]) // eslint-disable-line

  function handleSaved(addr: Address) {
    setAddresses(prev => [...prev, addr])
    setSelected(addr.id)
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('user_addresses').delete().eq('id', id)
    const next = addresses.filter(a => a.id !== id)
    setAddresses(next)
    if (selected === id) setSelected(next[0]?.id ?? null)
    if (next.length === 0) setShowForm(true)
    toast.success('Address removed')
  }

  function handleContinue() {
    const addr = addresses.find(a => a.id === selected)
    if (!addr) return
    onContinue(addr)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12 gap-2 text-text-muted">
      <Loader2 size={16} className="animate-spin" /> Loading addresses…
    </div>
  )

  return (
    <div className="space-y-4">
      {addresses.map(addr => (
        <div
          key={addr.id}
          onClick={() => setSelected(addr.id)}
          className={`relative p-4 rounded-2xl border-2 transition-colors cursor-pointer ${selected === addr.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              {addr.label && (
                <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${selected === addr.id ? 'text-primary' : 'text-text-muted'}`}>
                  {addr.label}
                </span>
              )}
              <p className="font-semibold text-sm text-text-primary">{addr.name}</p>
              <p className="text-xs text-text-muted mt-0.5">{addr.phone}</p>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.postcode} {addr.city}, {addr.state}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {selected === addr.id && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check size={11} className="text-black" />
                </div>
              )}
              <button onClick={e => { e.stopPropagation(); handleDelete(addr.id) }}
                className="p-1.5 text-text-muted hover:text-red-400 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {!showForm && addresses.length < 3 && (
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border rounded-2xl text-sm text-text-muted hover:border-primary/40 hover:text-primary transition-colors">
          <Plus size={14} /> Add Address {addresses.length > 0 ? `(${addresses.length}/3)` : ''}
        </button>
      )}

      {showForm && (
        <AddressForm
          onSaved={handleSaved}
          onCancel={() => addresses.length > 0 && setShowForm(false)}
          userId={userId}
          count={addresses.length}
        />
      )}

      {selected && !showForm && (
        <button onClick={handleContinue}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-black font-bold rounded-2xl hover:bg-primary/90 transition-colors">
          Continue to Payment <ArrowRight size={16} />
        </button>
      )}
    </div>
  )
}

// ── Payment Embed ─────────────────────────────────────────────────────────────
function CheckoutEmbed({ clientSecret }: { clientSecret: string }) {
  // Stable function reference — must not change after first render
  const fn = useMemo(() => () => Promise.resolve(clientSecret), [clientSecret])
  return (
    <EmbeddedCheckoutProvider
      stripe={stripePromise}
      options={{
        fetchClientSecret: fn,
      }}
    >
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function CheckoutFlow() {
  const { items, loading: cartLoading } = useCart()
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [step, setStep] = useState<'address' | 'payment'>('address')
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fetched = useRef(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login?redirect=/shop/pay'); return }
      setUserId(user.id)
    })
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!cartLoading && items.length === 0) router.replace('/shop/cart')
  }, [cartLoading, items.length]) // eslint-disable-line

  function handleAddressSelected(addr: Address) {
    setSelectedAddress(addr)
    setStep('payment')
    // Fetch Stripe session now that we have the address
    if (fetched.current) return
    fetched.current = true
    fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        addressId: addr.id,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setClientSecret(data.clientSecret)
      })
      .catch(() => setError('Network error. Please try again.'))
  }

  if (cartLoading || !userId) return (
    <div className="flex items-center justify-center py-24 gap-3 text-text-muted">
      <Loader2 size={20} className="animate-spin" /> Preparing checkout…
    </div>
  )

  const { subtotal, shippingFee, total } = (() => {
    const sub = items.reduce((s, i) => s + i.priceSnapshot * i.quantity, 0)
    const ship = sub >= 200 ? 0 : 8.90
    return { subtotal: sub, shippingFee: ship, total: sub + ship }
  })()

  return (
    <div className="space-y-8">
      {/* Row 1: step indicator + address / order summary side by side */}
      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left: step indicator + address step */}
        <div className="lg:col-span-3 space-y-6">
          {/* Step indicator */}
          <div className="flex items-center gap-3 text-sm">
            <div className={`flex items-center gap-1.5 font-medium ${step === 'address' ? 'text-primary' : 'text-text-muted'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'address' ? 'bg-primary text-black' : step === 'payment' ? 'bg-green-500 text-black' : 'bg-surface-variant text-text-muted'}`}>
                {step === 'payment' ? <Check size={12} /> : '1'}
              </span>
              Address
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className={`flex items-center gap-1.5 font-medium ${step === 'payment' ? 'text-primary' : 'text-text-muted'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'payment' ? 'bg-primary text-black' : 'bg-surface-variant text-text-muted'}`}>2</span>
              Payment
            </div>
          </div>

          {step === 'address' && userId && (
            <AddressStep userId={userId} onContinue={handleAddressSelected} />
          )}

          {step === 'payment' && selectedAddress && (
            <div className="flex items-start justify-between p-4 bg-card border border-border rounded-2xl">
              <div>
                <p className="text-xs text-text-muted mb-0.5 flex items-center gap-1"><MapPin size={10} /> Delivering to</p>
                <p className="text-sm font-semibold text-text-primary">{selectedAddress.name}</p>
                <p className="text-xs text-text-muted">{selectedAddress.phone}</p>
                <p className="text-xs text-text-secondary mt-0.5">{selectedAddress.line1}, {selectedAddress.postcode} {selectedAddress.city}, {selectedAddress.state}</p>
              </div>
              <button onClick={() => { setStep('address'); setClientSecret(null); fetched.current = false }}
                className="text-xs text-primary hover:underline shrink-0">
                Change
              </button>
            </div>
          )}
        </div>

        {/* Right: order summary */}
        <div className="lg:col-span-2">
          <div className="card p-5 space-y-4 sticky top-20">
            <h2 className="text-sm font-black uppercase gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>Order Summary</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map(item => (
                <div key={item.productId} className="flex justify-between text-xs text-text-secondary gap-2">
                  <span className="truncate">{item.name} ×{item.quantity}</span>
                  <span className="shrink-0 font-medium">{formatCurrency(item.priceSnapshot * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-border space-y-1.5 text-sm">
              <div className="flex justify-between text-text-secondary"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-text-secondary">
                <span>Shipping</span>
                <span className={shippingFee === 0 ? 'text-green-400' : ''}>{shippingFee === 0 ? 'FREE' : formatCurrency(shippingFee)}</span>
              </div>
              {shippingFee > 0 && <p className="text-[11px] text-text-muted">Free shipping on orders ≥ RM200</p>}
              <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
                <span className="text-text-primary">Total</span>
                <span className="price-srp">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Stripe embed — full width, only visible in payment step */}
      {step === 'payment' && (
        <div>
          {error && (
            <div className="p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
          )}
          {!clientSecret && !error && (
            <div className="flex items-center justify-center py-12 gap-2 text-text-muted">
              <Loader2 size={16} className="animate-spin" /> Preparing payment…
            </div>
          )}
          {/* FPX/bank redirect notice */}
          {clientSecret && (
            <div className="mb-3 flex items-start gap-2.5 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-xs text-text-muted">
              <span className="text-primary mt-0.5 shrink-0">🔒</span>
              <span>
                <strong className="text-text-secondary">Paying with FPX?</strong> You&apos;ll be redirected to your bank&apos;s secure portal to authorise the payment. You&apos;ll return here automatically once done.
                {' '}<strong className="text-text-secondary">Allow popups</strong> in your browser for the best experience.
              </span>
            </div>
          )}
          {clientSecret && <CheckoutEmbed clientSecret={clientSecret} />}
        </div>
      )}
    </div>
  )
}

export default function PayPage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <Link href="/shop/cart" className="inline-flex items-center gap-2 text-text-muted hover:text-text-secondary text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Cart
      </Link>
      <h1 className="text-xl font-black uppercase gradient-text mb-8" style={{ fontFamily: 'var(--font-orbitron)' }}>
        Checkout
      </h1>
      <Suspense fallback={
        <div className="flex items-center justify-center py-16 text-text-muted gap-3">
          <Loader2 size={20} className="animate-spin" /> Preparing…
        </div>
      }>
        <CheckoutFlow />
      </Suspense>
    </div>
  )
}