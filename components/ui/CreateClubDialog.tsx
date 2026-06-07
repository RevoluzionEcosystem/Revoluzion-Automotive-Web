'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Users, X, Plus } from 'lucide-react'

const CATEGORIES = ['Modified', 'JDM', 'Drift', 'Classic', 'EV', 'Track', 'Off-Road', 'Lowrider', 'Muscle', 'Supercar', 'General']
const STATES = ['Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu', 'Nationwide']

export function CreateClubDialog() {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    name: '',
    category: 'General',
    location: 'Selangor',
    description: '',
    rules: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please sign in to create a club'); return }

    setSaving(true)
    // Insert into car_clubs (matching mobile app table)
    const { data: clubData, error } = await supabase
      .from('car_clubs')
      .insert({
        owner_id: user.id,
        name: form.name.trim(),
        category: form.category,
        location: form.location,
        description: form.description.trim() || null,
        rules: form.rules.trim() || null,
        is_private: false,
        member_count: 1,
      })
      .select('id')
      .single()

    if (error) {
      toast.error('Failed to create club', { description: error.message })
      setSaving(false)
      return
    }

    // Auto-join as owner
    await supabase.from('car_club_members').insert({
      club_id: clubData.id,
      user_id: user.id,
      role: 'owner',
    })

    toast.success('Club created!', { description: `"${form.name}" is now live. You're the owner!` })
    setOpen(false)
    setForm({ name: '', category: 'General', location: 'Selangor', description: '', rules: '' })
    router.refresh()
    setSaving(false)
  }

  return (
    <>
      <button
        onClick={async () => {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) { toast.error('Sign in to create a club'); return }
          setOpen(true)
        }}
        className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
      >
        <Plus size={16} />
        Create Club
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <Users size={20} className="text-primary" />
                <h2 className="font-semibold text-text-primary text-lg">Create a Club</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Club Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Selangor Drift Kings"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
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
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Location</label>
                  <select className="input" value={form.location} onChange={(e) => set('location', e.target.value)}>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Description</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  placeholder="What's your club about? Tell potential members..."
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Club Rules <span className="text-text-muted font-normal">(optional)</span></label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="Respect, no drama, attend at least 2 meets per year..."
                  value={form.rules}
                  onChange={(e) => set('rules', e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Creating...' : 'Create Club'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
