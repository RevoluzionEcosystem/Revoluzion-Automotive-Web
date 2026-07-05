'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Wrench, X, Plus } from 'lucide-react'

const CATEGORIES = [
  { label: 'Workshop / Tyre Center', value: 'workshop' },
  { label: 'Car Wash & Detailing', value: 'car_wash' },
  { label: 'Car Paint & Bodywork', value: 'car_paint' },
  { label: 'Freelance & Mobile Mechanic', value: 'freelance_work' }
]

const DEFAULT_IMAGES: Record<string, string> = {
  workshop: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80',
  car_wash: 'https://images.unsplash.com/photo-1607860108855-64cac2078bd9?auto=format&fit=crop&w=800&q=80',
  car_paint: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
  freelance_work: 'https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?auto=format&fit=crop&w=800&q=80'
}

export function CreateServiceDialog() {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: '',
    category: 'workshop',
    price: '',
    location: '',
    latitude: '3.1390',
    longitude: '101.6869',
    description: '',
    banner_url: '',
    status: 'active', // can be 'active' (published) or 'draft'
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please sign in to list services'); return }

    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.price || isNaN(parseFloat(form.price))) { toast.error('Enter a valid base price'); return }
    if (isNaN(parseFloat(form.latitude)) || isNaN(parseFloat(form.longitude))) {
      toast.error('Latitude and Longitude must be valid numbers')
      return
    }

    setSaving(true)

    const finalBanner = form.banner_url.trim() || DEFAULT_IMAGES[form.category] || DEFAULT_IMAGES.workshop

    const { error } = await supabase.from('services').insert({
      user_id: user.id,
      title: form.title.trim(),
      category: form.category,
      price: parseFloat(form.price),
      location: form.location.trim() || null,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      description: form.description.trim() || null,
      banner_url: finalBanner,
      status: form.status,
    })

    setSaving(false)

    if (error) {
      toast.error('Failed to post service ad', { description: error.message })
    } else {
      toast.success('Service Listed Live! 🚀', { description: `"${form.title}" is now running in the navigation stream.` })
      setOpen(false)
      setForm({
        title: '',
        category: 'workshop',
        price: '',
        location: '',
        latitude: '3.1390',
        longitude: '101.6869',
        description: '',
        banner_url: '',
        status: 'active',
      })
      router.refresh()
    }
  }

  return (
    <>
      <button
        onClick={async () => {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) { toast.error('Sign in to list service ads'); return }
          setOpen(true)
        }}
        className="btn-primary flex items-center gap-2 px-4 py-2 text-sm uppercase font-bold tracking-wider"
        style={{ fontFamily: 'var(--font-orbitron)' }}
      >
        <Plus size={16} />
        List Service Ad
      </button>

      {open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setOpen(false)} />
          
          <div className="relative bg-[#0b0c10] border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-900 mb-4">
              <div className="flex items-center gap-2 text-primary">
                <Wrench size={18} />
                <h2 className="font-bold text-base uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-orbitron)' }}>
                  List Service / Business Ad
                </h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-white transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs text-left">
              <div>
                <label className="block text-text-secondary font-bold mb-1.5 uppercase">Business or Service Title *</label>
                <input
                  type="text"
                  required
                  className="input w-full bg-black text-white border border-slate-800 rounded-lg p-2.5 outline-none focus:border-primary/50 text-xs"
                  placeholder="e.g. Apex Performance Tuning & Exhausts"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary font-bold mb-1.5 uppercase">Category</label>
                  <select
                    className="input w-full bg-black text-white border border-slate-800 rounded-lg p-2.5 outline-none focus:border-primary/50 text-xs"
                    value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value} className="bg-black text-white">{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-text-secondary font-bold mb-1.5 uppercase">Publish State</label>
                  <select
                    className={`input w-full bg-black border border-slate-800 rounded-lg p-2.5 outline-none focus:border-primary/50 text-xs uppercase font-extrabold tracking-wider ${
                      form.status === 'active' ? 'text-emerald-400' : form.status === 'draft' ? 'text-slate-400' : 'text-yellow-400'
                    }`}
                    value={form.status}
                    onChange={(e) => set('status', e.target.value)}
                  >
                    <option value="active" className="text-emerald-400 bg-black">Active (Publish)</option>
                    <option value="draft" className="text-slate-400 bg-black">Draft (Private)</option>
                    <option value="inactive" className="text-yellow-400 bg-black">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary font-bold mb-1.5 uppercase">Starting / Base Price (RM) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    className="input w-full bg-black text-white border border-slate-800 rounded-lg p-2.5 outline-none focus:border-primary/50 text-xs"
                    placeholder="e.g. 150"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-bold mb-1.5 uppercase">Physical Address or Location *</label>
                  <input
                    type="text"
                    required
                    className="input w-full bg-black text-white border border-slate-800 rounded-lg p-2.5 outline-none focus:border-primary/50 text-xs"
                    placeholder="e.g. Petaling Jaya, Selangor"
                    value={form.location}
                    onChange={(e) => set('location', e.target.value)}
                  />
                </div>
              </div>

              {/* Coordinates fields based on requirement of maps integration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary font-bold mb-1.5 uppercase">Latitude Coordinate (GPS)</label>
                  <input
                    type="text"
                    required
                    className="input w-full bg-black text-white border border-slate-800 rounded-lg p-2.5 outline-none focus:border-primary/50 text-xs font-mono"
                    placeholder="e.g. 3.1118"
                    value={form.latitude}
                    onChange={(e) => set('latitude', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-bold mb-1.5 uppercase">Longitude Coordinate (GPS)</label>
                  <input
                    type="text"
                    required
                    className="input w-full bg-black text-white border border-slate-800 rounded-lg p-2.5 outline-none focus:border-primary/50 text-xs font-mono"
                    placeholder="e.g. 101.5973"
                    value={form.longitude}
                    onChange={(e) => set('longitude', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-secondary font-bold mb-1.5 uppercase">Banner Image Link (Optional)</label>
                <input
                  type="url"
                  className="input w-full bg-black text-white border border-slate-800 rounded-lg p-2.5 outline-none focus:border-primary/50 text-xs"
                  placeholder="Paste https:// image URL or leave empty for premium default category background."
                  value={form.banner_url}
                  onChange={(e) => set('banner_url', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-text-secondary font-bold mb-1.5 uppercase">Description of Service & Business Operations</label>
                <textarea
                  className="input w-full bg-black text-white border border-slate-800 rounded-lg p-2.5 outline-none focus:border-primary/50 text-xs h-20 resize-none"
                  placeholder="Detail your capabilities, operational hours, special features, and booking contact links..."
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-900 justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 border border-slate-800 rounded-lg text-text-muted hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.title.trim()}
                  className="btn-primary px-5 py-2 rounded-lg font-bold uppercase tracking-wider cursor-pointer"
                  style={{ fontFamily: 'var(--font-orbitron)' }}
                >
                  {saving ? 'Saving...' : 'List Live'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
