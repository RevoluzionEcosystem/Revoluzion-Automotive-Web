'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Wrench, MapPin, Trash2, ArrowLeft, Sparkles } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { EditServiceDialog } from '@/components/ui/EditServiceDialog'
import { toast } from 'sonner'

interface ServiceItem {
  id: string
  title: string
  category: string
  price: number
  location: string | null
  latitude: number | null
  longitude: number | null
  description: string | null
  banner_url: string | null
  created_at: string
  updated_at: string
  status: string
}

interface UserAuth {
  id: string
  email?: string
}

export default function ServicesDashboardPage() {
  const [user, setUser] = useState<UserAuth | null>(null)
  const [services, setServices] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const fetchUserServices = useCallback(async (uid: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Could not load services', { description: error.message })
    } else {
      setServices((data as unknown as ServiceItem[]) ?? [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    async function checkAuthAndFetch() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      setUser(user)
      fetchUserServices(user.id)
    }
    checkAuthAndFetch()
  }, [supabase, fetchUserServices])

  async function handleDelete(serviceId: string, title: string) {
    if (!confirm(`Are you sure you want to permanently delete "${title}"? This cannot be undone.`)) return
    setDeleteLoading(serviceId)

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId)

    setDeleteLoading(null)

    if (error) {
      toast.error('Deletion failed', { description: error.message })
    } else {
      toast.success('Service deleted successfully! 🗑️')
      setServices((prev) => prev.filter((s) => s.id !== serviceId))
      router.refresh()
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-32 text-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin rounded-full mx-auto" />
        <p className="text-xs text-text-muted">Loading your services portfolio matrix...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider animate-pulse" style={{ fontFamily: 'var(--font-orbitron)' }}>Access Restricted</h2>
        <p className="text-text-secondary text-sm">Please sign in to manage your listed workshop and business advertisements.</p>
        <Link href="/login" className="btn-primary inline-block py-2.5 px-6 rounded-xl font-bold uppercase tracking-wider text-xs" style={{ fontFamily: 'var(--font-orbitron)' }}>
          Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Breadcrumb Nav */}
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>
            My Business Ads
          </h1>
          <p className="text-text-muted text-xs">
            Manage physical workshop pointings, body washes, paint detailing ads and view their status.
          </p>
        </div>
      </div>

      {/* Overview Analytics Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-950/20 border border-slate-900 text-left">
          <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Total Advertisements</span>
          <span className="text-2xl font-bold text-white font-mono leading-none block mt-1">{services.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-950/20 border border-slate-900 text-left">
          <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Active Streamers</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono leading-none block mt-1">
            {services.filter((s) => s.status === 'active').length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-[#032024]/10 border border-primary/20 text-left">
          <span className="text-[10px] text-primary uppercase font-bold tracking-wider block">Account Tier</span>
          <span className="text-lg font-bold text-white uppercase font-mono tracking-widest leading-none block mt-1.5 flex items-center gap-1.5">
            <Sparkles size={14} className="text-primary animate-pulse" /> Verified Seller
          </span>
        </div>
      </div>

      {/* Main listings row */}
      {services.length === 0 ? (
        <div className="text-center py-20 text-text-muted bg-surface/10 border border-slate-900 rounded-2xl">
          <Wrench size={40} className="mx-auto mb-3 text-primary/10 animate-pulse" />
          <p className="font-semibold text-white uppercase text-xs tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>No listings found</p>
          <p className="text-xs max-w-xs mx-auto leading-relaxed mt-1">
            You haven&apos;t posted any service ads yet. List your business or workshop to reach members across Malaysia.
          </p>
          <Link href="/services" className="btn-primary inline-block py-2 px-4 rounded-xl text-[10px] mt-4 uppercase tracking-wider font-bold">
            Create First Ad
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((item) => {
            const isWorkshop = item.category === 'workshop'
            const isPaint = item.category === 'car_paint'
            
            const badgeColor = isWorkshop ? 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5' : isPaint ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'

            const isEdited = Math.abs(new Date(item.updated_at).getTime() - new Date(item.created_at).getTime()) > 5000

            return (
              <div 
                key={item.id} 
                className="p-4 rounded-xl bg-linear-to-b from-[#181d29] to-[#0d1017] border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                
                {/* Info summary */}
                <div className="flex gap-4 items-start text-left flex-1 min-w-0">
                  {item.banner_url && (
                    <div className="h-16 w-24 bg-surface rounded-lg border border-slate-950 shrink-0 overflow-hidden relative">
                      <img src={item.banner_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${badgeColor}`}>
                        {item.category.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        posted {timeAgo(item.created_at)}
                      </span>
                      {isEdited && (
                        <span className="text-[8px] font-mono uppercase bg-black text-[#6B7280] border border-slate-900 px-1 py-0.2 rounded">
                          (Edited)
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-xs uppercase text-white font-mono tracking-wide leading-tight line-clamp-1">
                      {item.title.replace(' [SeedMock]', '')}
                    </h3>
                    <p className="text-[10px] text-text-muted leading-relaxed line-clamp-1">{item.description}</p>
                    
                    {item.location && (
                      <div className="flex items-center gap-1 text-[9px] text-text-muted leading-none">
                        <MapPin size={9} className="text-primary" />
                        <span>{item.location} ({item.latitude}, {item.longitude})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price tag */}
                <div className="flex md:flex-col md:items-end justify-between items-center shrink-0 min-w-[110px] pt-3.5 md:pt-0 border-t md:border-t-0 border-white/5 gap-2">
                  <div className="text-left md:text-right">
                    <span className="text-[8px] text-text-muted uppercase block font-bold leading-none">Starting Rate</span>
                    <strong className="text-xs text-primary font-mono font-bold mt-1 block">RM {item.price}</strong>
                  </div>

                  {/* Actions (Update and delete CRUD) */}
                  <div className="flex items-center gap-1.5">
                    
                    {/* Reuse edit trigger */}
                    <EditServiceDialog 
                      service={{
                        id: item.id,
                        title: item.title,
                        category: item.category,
                        price: item.price,
                        location: item.location,
                        latitude: item.latitude,
                        longitude: item.longitude,
                        description: item.description,
                        banner_url: item.banner_url,
                        status: item.status
                      }}
                      onSuccess={() => fetchUserServices(user.id)}
                    />

                    {/* Delete button option */}
                    <button
                      type="button"
                      disabled={deleteLoading === item.id}
                      onClick={() => handleDelete(item.id, item.title)}
                      className="p-1.5 rounded-lg border border-slate-800 bg-black/40 hover:border-rose-500/40 hover:bg-rose-500/5 text-text-muted hover:text-rose-400 transition-all duration-200 flex items-center gap-1 cursor-pointer"
                      title="Permanently remove ad"
                    >
                      <Trash2 size={12} />
                      <span className="text-[9px] uppercase tracking-wider font-bold pr-1">
                        {deleteLoading === item.id ? 'Deleting...' : 'Delete'}
                      </span>
                    </button>

                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
