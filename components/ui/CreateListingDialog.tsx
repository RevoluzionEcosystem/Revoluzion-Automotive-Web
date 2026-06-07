'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ShoppingBag, X, Plus } from 'lucide-react'

const CATEGORIES = ['Parts', 'Accessories', 'Tools', 'Tyres & Rims', 'Electronics', 'Exhaust', 'Suspension', 'Body Kit', 'Interior', 'Other']
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Used']
const LISTING_TYPES = ['part', 'service', 'vehicle']

export function CreateListingDialog() {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: '',
    category: 'Parts',
    condition: 'Good',
    listing_type: 'part',
    price: '',
    location: '',
    description: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please sign in to post a listing'); return }

    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.price || isNaN(parseFloat(form.price))) { toast.error('Enter a valid price'); return }

    setSaving(true)
    const { error } = await supabase.from('marketplace_listings').insert({
      user_id: user.id,
      title: form.title.trim(),
      category: form.category,
      condition: form.condition,
      listing_type: form.listing_type,
      price: parseFloat(form.price),
      location: form.location.trim() || null,
      description: form.description.trim() || null,
      status: 'active',
    })

    if (error) {
      toast.error('Failed to post listing', { description: error.message })
    } else {
      toast.success('Listing posted!', { description: `"${form.title}" is now live on the marketplace.` })
      setOpen(false)
      setForm({ title: '', category: 'Parts', condition: 'Good', listing_type: 'part', price: '', location: '', description: '' })
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <>
      <button
        onClick={async () => {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) { toast.error('Sign in to post listings'); return }
          setOpen(true)
        }}
        className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
      >
        <Plus size={16} />
        Post Listing
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} className="text-primary" />
                <h2 className="font-semibold text-text-primary text-lg">Post a Listing</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Listing Title *</label>
                <input
                  className="input"
                  placeholder="e.g. Bride Zeta IV bucket seat"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Type</label>
                  <select className="input" value={form.listing_type} onChange={(e) => set('listing_type', e.target.value)}>
                    <option value="part">Part / Accessory</option>
                    <option value="service">Service</option>
                    <option value="vehicle">Vehicle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Category</label>
                  <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Condition</label>
                  <select className="input" value={form.condition} onChange={(e) => set('condition', e.target.value)}>
                    {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Price (RM) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    placeholder="0.00"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Location</label>
                <input
                  className="input"
                  placeholder="e.g. Petaling Jaya, Selangor"
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Description</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  placeholder="Describe your item — condition, fitment, reason for selling..."
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Posting...' : 'Post Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
