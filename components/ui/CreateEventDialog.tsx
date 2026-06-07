'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CalendarDays, X, Plus } from 'lucide-react'

const CATEGORIES = ['Car Meet', 'Track Day', 'Show & Shine', 'Charity', 'Club Run', 'Workshop', 'Race', 'Auction', 'Cruise', 'Training', 'Other']
const STATES = ['Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Putrajaya', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu']

export function CreateEventDialog() {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: '',
    category: 'Car Meet',
    date: '',
    time: '',
    location: '',
    state: 'Selangor',
    price: '',
    description: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please sign in to create an event'); return }

    setSaving(true)
    const { error } = await supabase.from('events').insert({
      user_id: user.id,
      title: form.title.trim(),
      category: form.category,
      date: form.date || null,
      time: form.time || null,
      location: form.location.trim() || null,
      state: form.state,
      price: parseFloat(form.price) || 0,
      description: form.description.trim() || null,
      status: 'upcoming',
    })

    if (error) {
      toast.error('Failed to create event', { description: error.message })
    } else {
      toast.success('Event created!', { description: `"${form.title}" is now live.` })
      setOpen(false)
      setForm({ title: '', category: 'Car Meet', date: '', time: '', location: '', state: 'Selangor', price: '', description: '' })
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <>
      <button
        onClick={async () => {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) { toast.error('Sign in to create events'); return }
          setOpen(true)
        }}
        className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
      >
        <Plus size={16} />
        Create Event
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <CalendarDays size={20} className="text-primary" />
                <h2 className="font-semibold text-text-primary text-lg">Create Event</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Event Title *</label>
                <input
                  className="input"
                  placeholder="e.g. KL Car Meet 2026"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Category</label>
                  <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">State</label>
                  <select className="input" value={form.state} onChange={(e) => set('state', e.target.value)}>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Date *</label>
                  <input type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Time</label>
                  <input type="time" className="input" value={form.time} onChange={(e) => set('time', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Venue / Location</label>
                <input
                  className="input"
                  placeholder="e.g. Sepang International Circuit"
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Ticket Price (RM) — leave blank for Free</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Description</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  placeholder="Tell people what to expect..."
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
