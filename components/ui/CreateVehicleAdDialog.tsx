'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Car, X, Plus } from 'lucide-react'

const MAKES = ['BMW', 'Mercedes-Benz', 'Toyota', 'Honda', 'Nissan', 'Porsche', 'Mazda', 'Ducati', 'Yamaha', 'Harley-Davidson', 'Other']

export function CreateVehicleAdDialog() {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: '',
    make: 'Toyota',
    model: '',
    year: '',
    mileage: '',
    price: '',
    transmission: 'Automatic',
    location: '',
    description: '',
    image_url: '',
    status: 'active',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please sign in to register vehicle listings'); return }

    if (!form.title.trim()) { toast.error('Listing title is required'); return }
    if (!form.price || isNaN(parseFloat(form.price))) { toast.error('Please enter a valid price'); return }

    setSaving(true)
    const { error } = await supabase.from('vehicle_listings').insert({
      user_id: user.id,
      title: form.title.trim(),
      make: form.make,
      model: form.model.trim() || null,
      year: form.year ? parseInt(form.year) : null,
      mileage: form.mileage ? parseFloat(form.mileage) : null,
      price: parseFloat(form.price),
      transmission: form.transmission,
      location: form.location.trim() || null,
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      status: form.status,
    })

    if (error) {
      toast.error('Failed to post vehicle listing', { description: error.message })
    } else {
      toast.success('Vehicle listing posted!', { description: `"${form.title}" is now active.` })
      setOpen(false)
      setForm({
        title: '',
        make: 'Toyota',
        model: '',
        year: '',
        mileage: '',
        price: '',
        transmission: 'Automatic',
        location: '',
        description: '',
        image_url: '',
        status: 'active',
      })
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <>
      <button
        onClick={async () => {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) { toast.error('Sign in to list vehicles'); return }
          setOpen(true)
        }}
        className="btn-primary flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider shrink-0"
        style={{ fontFamily: 'var(--font-orbitron)' }}
      >
        <Plus size={16} />
        Post Vehicle
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 text-xs">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-surface border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-surface border-b border-white/5 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <Car size={20} className="text-primary animate-pulse" />
                <h2 className="font-bold text-white uppercase tracking-wider text-base font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                  Post Vehicle Listing
                </h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-white transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">Vehicle Title *</label>
                <input
                  className="input h-11 text-sm bg-black border border-slate-800 focus:border-primary/50 text-white rounded-xl"
                  placeholder="e.g. 2018 Porsche Cayman 718 GTS 2.5 Manual"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">Make / manufacturer</label>
                  <select className="input h-11 text-sm bg-black border border-slate-800 focus:border-primary/50 text-white rounded-xl uppercase font-bold" value={form.make} onChange={(e) => set('make', e.target.value)}>
                    {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">Model Family</label>
                  <input
                    className="input h-11 text-sm bg-black border border-slate-800 focus:border-primary/50 text-white rounded-xl"
                    placeholder="e.g. Cayman 718"
                    value={form.model}
                    onChange={(e) => set('model', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">Manufacture Year</label>
                  <input
                    type="number"
                    className="input h-11 text-sm bg-black border border-slate-800 focus:border-primary/50 text-white rounded-xl"
                    placeholder="e.g. 2018"
                    value={form.year}
                    onChange={(e) => set('year', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">Mileage (km)</label>
                  <input
                    type="number"
                    className="input h-11 text-sm bg-black border border-slate-800 focus:border-primary/50 text-white rounded-xl"
                    placeholder="e.g. 32000"
                    value={form.mileage}
                    onChange={(e) => set('mileage', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">Transmission</label>
                  <select className="input h-11 text-sm bg-black border border-slate-800 focus:border-primary/50 text-white rounded-xl" value={form.transmission} onChange={(e) => set('transmission', e.target.value)}>
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic (DCT / Torque Conv.)</option>
                    <option value="CVT">CVT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">Listing Price (RM) *</label>
                  <input
                    type="number"
                    className="input h-11 text-sm bg-black border border-slate-800 focus:border-primary/50 text-white rounded-xl"
                    placeholder="e.g. 420000"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">Cover Image URL</label>
                <input
                  className="input h-11 text-sm bg-black border border-slate-800 focus:border-primary/50 text-white rounded-xl"
                  placeholder="https://images.unsplash.com/..."
                  value={form.image_url}
                  onChange={(e) => set('image_url', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">Location (City, State / Region)</label>
                <input
                  className="input h-11 text-sm bg-black border border-slate-800 focus:border-primary/50 text-white rounded-xl"
                  placeholder="e.g. Ara Damansara, PJ"
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">Description & Build Specs</label>
                <textarea
                  className="input p-3 text-sm bg-black border border-slate-800 focus:border-primary/50 text-white rounded-xl resize-none"
                  rows={3}
                  placeholder="Describe modification records, accessories, accident states..."
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-white/5 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-5 h-11 bg-transparent border border-slate-800 hover:bg-slate-900 rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 h-11 bg-primary text-black font-bold uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-98 transition-all cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
