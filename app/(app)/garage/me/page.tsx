'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Car, Plus, Trash2, Calendar, Palette, Eye, Heart, User } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { GarageSidebar } from '../GarageSidebar'

export default function MyGaragePage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState({ make: '', model: '', year: '', color: '', engine: '', cc: '', hp: '', torque: '' })
  const [saving, setSaving] = useState(false)
  const [mountedUserId, setMountedUserId] = useState<string | null>(null)

  // Real-time Auth State sync listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setMountedUserId(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setMountedUserId(session?.user?.id ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
    staleTime: 5 * 60 * 1000,
  })

  const activeUserId = mountedUserId || user?.id

  const { data: cars = [], isLoading } = useQuery({
    queryKey: ['my-cars', activeUserId],
    queryFn: async () => {
      if (!activeUserId) return []
      const { data, error } = await supabase
        .from('cars')
        .select('*, users!cars_user_id_fkey(id, username, display_name, avatar_url, is_verified)')
        .eq('user_id', activeUserId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!activeUserId,
  })

  const deleteMutation = useMutation({
    mutationFn: async (carId: string) => {
      await supabase.from('cars').delete().eq('id', carId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-cars'] })
      toast.success('Vehicle removed 🗑️', { description: 'The car has been removed from your garage.' })
    },
  })

  async function handleAddCar(e: React.FormEvent) {
    e.preventDefault()
    const finalUserId = activeUserId || user?.id
    if (!finalUserId) { router.push('/login'); return }
    setSaving(true)

    const { error } = await supabase.from('cars').insert({
      user_id: finalUserId,
      make: form.make.trim(),
      model: form.model.trim(),
      year: form.year ? parseInt(form.year, 10) : null,
      color: form.color.trim() || null,
      engine: form.engine.trim() || null,
      cc: form.cc ? parseInt(form.cc, 10) : null,
      hp: form.hp ? parseInt(form.hp, 10) : null,
      torque: form.torque ? parseInt(form.torque, 10) : null,
    })

    if (error) {
      console.error('Error adding car:', error)
      toast.error('Could not add vehicle', {
        description: `Database error: ${error.message}. Please check your details and try again.`
      })
    } else {
      toast.success('Added to garage! 🚗', { description: 'Your vehicle has been added to your collection.' })
      setForm({ make: '', model: '', year: '', color: '', engine: '', cc: '', hp: '', torque: '' })
      setShowAddForm(false)
      queryClient.invalidateQueries({ queryKey: ['my-cars'] })
    }
    setSaving(false)
  }

  if (!activeUserId && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted px-4">
        <Car size={48} className="mb-4 opacity-30" />
        <p className="text-lg mb-2">Sign in to view your garage</p>
        <button onClick={() => router.push('/login')} className="btn-primary mt-4">Sign In</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6">
      {/* Unified Left Sidebar */}
      <GarageSidebar />

      {/* Right Main Interface */}
      <main className="flex-1 min-w-0 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>My Collection</h1>
            <p className="text-text-muted text-sm mt-1">{cars.length} vehicle{cars.length !== 1 ? 's' : ''} in your workspace</p>
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
          <form onSubmit={handleAddCar} className="card p-5 space-y-4">
            <h2 className="font-semibold text-text-primary">Add a new vehicle</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
              <div>
                <label className="block text-xs text-text-muted mb-1">CC</label>
                <input type="number" value={form.cc} onChange={(e) => setForm({ ...form, cc: e.target.value })} className="input text-sm" placeholder="3000" />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">HP</label>
                <input type="number" value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} className="input text-sm" placeholder="320" />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Torque</label>
                <input type="number" value={form.torque} onChange={(e) => setForm({ ...form, torque: e.target.value })} className="input text-sm" placeholder="427" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Adding...' : 'Add to Garage'}</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn-ghost">Cancel</button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card h-90 bg-surface/50 border border-border/40 rounded-2xl" />
            ))}
          </div>
        ) : cars.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            <Car size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">Your collection is empty</p>
            <p className="text-sm">Add your first vehicle to configure custom models</p>
            <button onClick={() => setShowAddForm(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus size={16} /> Add Your First Car
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in pb-16">
            {cars.map((car) => {
              const author = car.users as { display_name?: string | null; username?: string | null } | null || {}
              return (
                <div
                  key={car.id}
                  onClick={() => router.push(`/garage/${car.id}`)}
                  className="group relative flex flex-col justify-between h-90 rounded-2xl bg-linear-to-b from-[#181d29] to-[#0d1017] border border-white/5 hover:border-white/15 transition-all duration-300 cursor-pointer overflow-hidden text-left"
                >
                  {/* Aspect Ratio Cover Photo Container */}
                  <div className="relative w-full h-45 bg-[#0e1017] overflow-hidden shrink-0">
                    {car.image_url ? (
                      <Image
                        src={car.image_url}
                        alt={`${car.make} ${car.model}`}
                        fill
                        className="object-cover group-hover:scale-103 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    ) : (
                      // Futuristic wireframe vector blueprint fallback
                      <div className="absolute inset-0 bg-[#0e1017] flex flex-col items-center justify-center overflow-hidden select-none">
                        <Car size={40} className="text-slate-700 group-hover:text-primary/20 transition-colors duration-500" />
                      </div>
                    )}

                    {/* Absolute positioning modifier delete button overlay */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (confirm('Remove this vehicle from your collection?')) {
                          deleteMutation.mutate(car.id)
                        }
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-full border border-white/10 bg-black/60 backdrop-blur-sm flex items-center justify-center text-text-muted hover:text-error hover:bg-error/10 transition-all z-10 hover:border-white/30"
                      title="Remove Car"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Card Details specs list body */}
                  <div className="p-4 flex-1 flex flex-col justify-between min-w-0 bg-transparent">
                    <div className="space-y-1.5 min-w-0">
                      {/* Make + Model Heading */}
                      <div>
                        <h3
                          className="text-[17px] font-bold text-white leading-snug truncate"
                          title={`${car.make} ${car.model}`}
                          style={{ fontFamily: 'var(--font-inter), sans-serif' }}
                        >
                          {car.make} {car.model}
                        </h3>
                      </div>

                      {/* Calendar (Year) & Color Rows inside sub-block */}
                      <div className="space-y-1 text-[13px] text-slate-400 font-medium leading-none">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-[#475569] shrink-0" />
                          <span>{car.year ?? '—'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Palette size={13} className="text-[#475569] shrink-0" />
                          <span className="capitalize">{car.color ? car.color.toLowerCase() : '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div className="pt-3 flex items-center justify-between text-xs font-medium border-0">
                      {/* Left side: User icon + display name */}
                      {author && (
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2 text-slate-400">
                          <User size={13} className="text-[#475569] shrink-0" />
                          <span className="truncate leading-none">
                            {author.display_name || author.username}
                          </span>
                        </div>
                      )}

                      {/* Right side: Views & Likes icons with counts */}
                      <div className="flex items-center gap-3 shrink-0 text-slate-400 font-mono leading-none">
                        <span className="flex items-center gap-1" title="Views">
                          <Eye size={13} className="text-[#475569]" />
                          <span>{car.views ?? 0}</span>
                        </span>
                        <span className="flex items-center gap-1" title="Likes">
                          <Heart size={12} className="text-error fill-error stroke-error" />
                          <span>{car.likes_count ?? 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
