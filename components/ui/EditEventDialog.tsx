'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Edit2, Trash2, X, Calendar, MapPin, Link2 } from 'lucide-react'

interface EditEventDialogProps {
  event: {
    id: string
    title: string
    description: string | null
    date: string | null
    time: string | null
    location: string | null
    state: string | null
    external_link: string | null
    price: string | null
  }
}

const STATES = ['Selangor', 'Kuala Lumpur', 'Penang', 'Johor', 'Melaka', 'Perak', 'Sabah', 'Sarawak', 'Pahang', 'Kedah', 'Kelantan', 'Terengganu', 'Negeri Sembilan', 'Perlis', 'Putrajaya', 'Labuan']

export function EditEventDialog({ event }: EditEventDialogProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: event.title || '',
    description: event.description || '',
    date: event.date || '',
    time: event.time || '',
    location: event.location || '',
    state: event.state || 'Selangor',
    externalLink: event.external_link || '',
    price: event.price || 'Free',
  })

  function set(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.date) { toast.error('Date is required'); return }
    if (!form.time) { toast.error('Time is required'); return }
    if (!form.location.trim()) { toast.error('Location is required'); return }

    setSaving(true)

    const { error } = await supabase
      .from('events')
      .update({
        title: form.title.trim(),
        description: form.description.trim() || null,
        date: form.date,
        time: form.time,
        location: form.location.trim(),
        state: form.state,
        external_link: form.externalLink.trim() || null,
        price: form.price,
      })
      .eq('id', event.id)

    if (error) {
      toast.error('Failed to update event', { description: error.message })
    } else {
      toast.success('Event updated successfully! 🚗💨')
      setOpen(false)
      router.refresh()
    }
    setSaving(false)
  }

  async function handleDelete() {
    const doubleConfirm = window.confirm('Are you absolutely sure you want to permanently delete this event? This action is irreversible.')
    if (!doubleConfirm) return

    setDeleting(true)
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', event.id)

    if (error) {
      toast.error('Failed to delete event', { description: error.message })
    } else {
      toast.success('Event deleted permanently.')
      setOpen(false)
      router.push('/events')
      router.refresh()
    }
    setDeleting(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase text-text-secondary bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/25 rounded-md tracking-wider transition-all"
        style={{ fontFamily: 'var(--font-orbitron)' }}
      >
        <Edit2 size={11} className="text-primary-light" /> Edit Meet
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setOpen(false)} />
          <div className="relative bg-[#0d1017] border border-[#1f2937] rounded-x animate-scale-in w-full max-w-lg max-h-[96vh] sm:max-h-[92vh] overflow-y-auto shadow-2xl rounded-2xl">
            
            {/* Sticky Header */}
            <div className="sticky top-0 bg-[#0d1017]/95 backdrop-blur-xs border-b border-border/80 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <Edit2 size={18} className="text-primary" />
                <h2 className="font-bold text-text-primary text-base sm:text-lg" style={{ fontFamily: 'var(--font-orbitron)' }}>Modify Meet / Event</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-4 sm:p-6 space-y-4 text-xs font-semibold">
              
              <div>
                <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-1.5">
                  Meetup Title <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  className="input w-full bg-gradient-to-b from-black to-[#090b10] border border-white/10 rounded-lg p-2.5 text-white placeholder:text-text-muted/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/25 text-xs font-semibold"
                  placeholder="e.g. PJ Midnight Coffee Cruise & Meet"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-1.5">
                  Description <span className="text-red-500 font-bold">*</span>
                </label>
                <textarea
                  className="input w-full bg-gradient-to-b from-black to-[#090b10] border border-white/10 rounded-lg p-2.5 text-white placeholder:text-text-muted/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/25 text-xs resize-none"
                  rows={4}
                  placeholder="Strictly classic JDMs, clean build euros..."
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-1.5">
                    Date <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    className="input w-full bg-gradient-to-b from-black to-[#090b10] border border-white/10 rounded-lg p-2.5 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/25 text-xs"
                    value={form.date}
                    onChange={(e) => set('date', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-1.5">
                    Time <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="time"
                    className="input w-full bg-gradient-to-b from-black to-[#090b10] border border-white/10 rounded-lg p-2.5 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/25 text-xs"
                    value={form.time}
                    onChange={(e) => set('time', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-1.5">
                    Venue / Location <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      className="input w-full bg-gradient-to-b from-black to-[#090b10] border border-white/10 rounded-lg pl-8 pr-2.5 py-2.5 text-white placeholder:text-text-muted/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/25 text-xs"
                      placeholder="Starbucks PJ"
                      value={form.location}
                      onChange={(e) => set('location', e.target.value)}
                      required
                    />
                    <MapPin size={13} className="absolute left-2.5 top-3.5 text-text-muted" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-1.5">
                    State <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    className="input w-full bg-gradient-to-b from-black to-[#090b10] border border-white/10 rounded-lg p-2.5 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/25 text-xs font-bold"
                    value={form.state}
                    onChange={(e) => set('state', e.target.value)}
                    required
                  >
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-1.5">External Link</label>
                <div className="relative">
                  <input
                    type="url"
                    className="input w-full bg-gradient-to-b from-black to-[#090b10] border border-white/10 rounded-lg pl-8 pr-2.5 py-2.5 text-white placeholder:text-text-muted/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/25 text-xs"
                    placeholder="https://instagram.com/..."
                    value={form.externalLink}
                    onChange={(e) => set('externalLink', e.target.value)}
                  />
                  <Link2 size={13} className="absolute left-2.5 top-3.5 text-text-muted" />
                </div>
              </div>

              {/* Action Rows */}
              <div className="flex flex-col sm:flex-row gap-2 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 hover:border-red-900/60 text-red-400 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 justify-center"
                >
                  <Trash2 size={13} /> {deleting ? 'Deleting...' : 'Delete Permanently'}
                </button>
                <div className="flex gap-2 sm:flex-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2.5 bg-transparent border border-white/10 text-text-muted hover:bg-white/5 rounded-xl text-xs font-semibold flex-1 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary py-2.5 rounded-xl text-xs font-bold flex-1"
                  >
                    {saving ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  )
}