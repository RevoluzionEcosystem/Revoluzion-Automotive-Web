'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Car, Plus, Trash2, Fuel, Calendar, Palette } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { Car as CarType } from '@/lib/supabase/types'
import { useRouter } from 'next/navigation'

export default function GaragePage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState({ make: '', model: '', year: '', color: '', engine: '' })
  const [saving, setSaving] = useState(false)

  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: cars = [], isLoading } = useQuery({
    queryKey: ['my-cars', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data } = await supabase
        .from('cars')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      return (data ?? []) as CarType[]
    },
    enabled: !!user,
  })

  const deleteMutation = useMutation({
    mutationFn: async (carId: string) => {
      await supabase.from('cars').delete().eq('id', carId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-cars'] })
      toast.success('Car removed from garage')
    },
  })

  async function handleAddCar(e: React.FormEvent) {
    e.preventDefault()
    if (!user) { router.push('/login'); return }
    setSaving(true)

    const { error } = await supabase.from('cars').insert({
      user_id: user.id,
      make: form.make.trim(),
      model: form.model.trim(),
      year: form.year ? parseInt(form.year) : null,
      color: form.color.trim() || null,
      engine: form.engine.trim() || null,
    })

    if (error) {
      toast.error('Failed to add car')
    } else {
      toast.success('Car added to garage!')
      setForm({ make: '', model: '', year: '', color: '', engine: '' })
      setShowAddForm(false)
      queryClient.invalidateQueries({ queryKey: ['my-cars'] })
    }
    setSaving(false)
  }

  if (!user && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted px-4">
        <Car size={48} className="mb-4 opacity-30" />
        <p className="text-lg mb-2">Sign in to view your garage</p>
        <a href="/login" className="btn-primary mt-4">Sign In</a>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>My Garage</h1>
          <p className="text-text-muted text-sm mt-1">{cars.length} vehicle{cars.length !== 1 ? 's' : ''} in your garage</p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Add Car
        </button>
      </div>

      {/* Add car form */}
      {showAddForm && (
        <form onSubmit={handleAddCar} className="card p-5 mb-6 space-y-4">
          <h2 className="font-semibold text-text-primary">Add a new vehicle</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Make *</label>
              <input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} className="input text-sm" placeholder="Toyota" required />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Model *</label>
              <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="input text-sm" placeholder="Supra" required />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Year</label>
              <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="input text-sm" placeholder="2023" min="1900" max={new Date().getFullYear() + 1} />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Color</label>
              <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="input text-sm" placeholder="Midnight Black" />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Engine</label>
              <input value={form.engine} onChange={(e) => setForm({ ...form, engine: e.target.value })} className="input text-sm" placeholder="2JZ-GTE" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Adding...' : 'Add to Garage'}</button>
            <button type="button" onClick={() => setShowAddForm(false)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse h-40" />
          ))}
        </div>
      ) : cars.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <Car size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg mb-2">Your garage is empty</p>
          <p className="text-sm">Add your first vehicle to get started</p>
          <button onClick={() => setShowAddForm(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus size={16} /> Add Your First Car
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cars.map((car) => (
            <div key={car.id} className="card group relative overflow-hidden">
              {car.image_url ? (
                <div className="aspect-video overflow-hidden">
                  <Image src={car.image_url} alt={`${car.make} ${car.model}`} width={400} height={225} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-surface-variant to-background flex items-center justify-center">
                  <Car size={40} className="text-primary/30" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-text-primary">{car.make} {car.model}</h3>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {car.year && (
                        <span className="flex items-center gap-1 text-text-muted text-xs">
                          <Calendar size={12} /> {car.year}
                        </span>
                      )}
                      {car.color && (
                        <span className="flex items-center gap-1 text-text-muted text-xs">
                          <Palette size={12} /> {car.color}
                        </span>
                      )}
                      {car.engine && (
                        <span className="flex items-center gap-1 text-text-muted text-xs">
                          <Fuel size={12} /> {car.engine}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => { if (confirm('Remove this car?')) deleteMutation.mutate(car.id) }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
