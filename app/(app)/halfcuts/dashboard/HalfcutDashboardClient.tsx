'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  ShoppingBag, ArrowLeft, Plus, MapPin, Phone, Trash2, Edit3, Layers, CheckCircle2, EyeOff
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface HalfcutDashboardProps {
  user: any
  userHalfcuts: any[]
  totalBundles: number
  activeCount: number
  draftCount: number
  inactiveCount: number
}

export function HalfcutDashboardClient({
  user,
  userHalfcuts,
  totalBundles,
  activeCount,
  draftCount,
  inactiveCount,
}: HalfcutDashboardProps) {
  const supabase = createClient()
  const router = useRouter()
  const [halfcuts, setHalfcuts] = useState<any[]>(userHalfcuts)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleRefresh = async () => {
    const { data } = await supabase
      .from('halfcuts')
      .select('*, halfcut_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setHalfcuts(data)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to permanently delete this entire Halfcut donor bundle and all listed part sheets? This is irreversible.')) return

    setDeletingId(id)
    try {
      const { error } = await supabase
        .from('halfcuts')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Halfcut bundle deleted successfully!')
      setHalfcuts((prev) => prev.filter((item) => item.id !== id))
    } catch (err: any) {
      toast.error('Failed to remove listing set', { description: err.message })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 text-xs">
      {/* Header Back Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/5 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white uppercase tracking-wider font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
              My Halfcuts Dashboard
            </h1>
          </div>
          <p className="text-text-secondary text-xs">Manage listed car stripping bundles, spares packages, edit pricing states, or view draft components privately</p>
        </div>

        <Link
          href="/halfcuts/post"
          className="h-10 px-5 bg-primary text-black font-bold uppercase tracking-wider rounded-xl transition-all duration-200 hover:opacity-90 active:scale-98 flex items-center justify-center gap-1.5 self-start sm:self-auto"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          <Plus size={16} /> Post Halfcut Set
        </Link>
      </div>

      {/* Stats Summary Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient border border-slate-800 rounded-xl flex flex-col justify-between">
          <span className="text-text-muted text-[10px] font-black uppercase tracking-wider font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>Total Bundles</span>
          <span className="text-2xl font-black text-white mt-1">{totalBundles}</span>
        </div>
        <div className="p-4 bg-gradient border border-slate-800 rounded-xl flex flex-col justify-between">
          <span className="text-text-muted text-[10px] font-black uppercase tracking-wider font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>Active (Green)</span>
          <span className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</span>
        </div>
        <div className="p-4 bg-gradient border border-slate-800 rounded-xl flex flex-col justify-between">
          <span className="text-text-muted text-[10px] font-black uppercase tracking-wider font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>Draft (Silver)</span>
          <span className="text-2xl font-black text-slate-400 mt-1">{draftCount}</span>
        </div>
        <div className="p-4 bg-gradient border border-slate-800 rounded-xl flex flex-col justify-between">
          <span className="text-text-muted text-[10px] font-black uppercase tracking-wider font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>Inactive (Yellow)</span>
          <span className="text-2xl font-black text-yellow-500 mt-1">{inactiveCount}</span>
        </div>
      </div>

      {/* Main Listings Body */}
      <div className="bg-surface border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
            Published Spares Sheets & Bundles
          </h3>
          <button 
            type="button" 
            onClick={handleRefresh} 
            className="text-[10px] text-primary uppercase font-bold tracking-wider hover:underline"
          >
            Click to Reload List
          </button>
        </div>

        {halfcuts.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <Layers size={40} className="text-primary/30 mx-auto animate-pulse" />
            <p className="text-text-muted text-xs">You haven&apos;t posted any halfcut bundle packages or listings yet.</p>
            <Link href="/halfcuts/post" className="btn-primary inline-flex text-[10px] font-bold py-1.5 px-4 rounded-lg uppercase">
              Register First Sheet
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {halfcuts.map((hc) => {
              const itemsList = hc.halfcut_items || []
              let statusLabel = 'Active'
              let statusColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'

              if (hc.status === 'draft') {
                statusLabel = 'Draft'
                statusColor = 'bg-slate-500/10 text-slate-400 border-slate-500/20'
              } else if (hc.status === 'inactive') {
                statusLabel = 'Inactive'
                statusColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
              }

              return (
                <div key={hc.id} className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-primary self-start shrink-0">
                      <ShoppingBag size={20} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-white line-clamp-1">{hc.title}</h4>
                        <span className={`px-2 py-0.5 rounded border text-[9px] uppercase font-bold ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-text-muted font-medium">
                        {hc.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={11} className="text-primary/70" /> {hc.location}
                          </span>
                        )}
                        {hc.contact && (
                          <span className="flex items-center gap-1">
                            <Phone size={11} className="text-teal-400" /> {hc.contact}
                          </span>
                        )}
                        <span className="bg-slate-900/60 px-1.5 py-0.5 border border-slate-800/85 text-text-secondary rounded">
                          {itemsList.length} component row(s) listed
                        </span>
                      </div>

                      {/* Display small previews of components list */}
                      {itemsList.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1.5 max-w-xl">
                          {itemsList.slice(0, 4).map((i: any, index: number) => (
                            <span 
                              key={i.id || index}
                              className="text-[9px] px-1.5 py-0.5 bg-black/40 border border-white/5 rounded text-text-secondary line-clamp-1 truncate max-w-[120px]"
                            >
                              {i.title}
                            </span>
                          ))}
                          {itemsList.length > 4 && (
                            <span className="text-[9px] px-1 py-0.5 text-primary-light font-bold">
                              + {itemsList.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
                    <Link
                      href={`/halfcuts/edit/${hc.id}`}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wide transition-all"
                    >
                      <Edit3 size={11} /> Edit Listing
                    </Link>
                    <button
                      type="button"
                      disabled={deletingId === hc.id}
                      onClick={() => handleDelete(hc.id)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 rounded-xl transition-all"
                      title="Permanently Delete Bundle"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}