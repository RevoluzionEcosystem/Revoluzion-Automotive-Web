'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Search, X, MapPin, Phone, Layers, Hammer, HelpCircle, ArrowUpDown, Edit, CheckCircle, RefreshCw } from 'lucide-react'
import { SafeImage } from '@/components/ui/SafeImage'
import type { HalfcutWithUser, HalfcutItem } from '@/lib/supabase/types'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { EditHalfcutItemModal } from '@/components/ui/EditHalfcutItemModal'

interface Props {
  halfcut: HalfcutWithUser
}

export function HalfcutDetailClient({ halfcut }: Props) {
  const supabase = createClient()
  const [q, setQ] = useState('')
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'alphabetical'>('default')
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null)
  
  // Custom states for local edit capabilities and live interaction
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [localItems, setLocalItems] = useState<HalfcutItem[]>(halfcut.halfcut_items || [])
  const [editingItem, setEditingItem] = useState<HalfcutItem | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    async function getSession() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setSessionUserId(user.id)
      }
    }
    getSession()
  }, [supabase])

  // Is current viewer the owner of this halfcut?
  const isOwner = sessionUserId && halfcut.user_id === sessionUserId

  // Calculate pricing summaries and stock status metrics
  const prices = useMemo(() => {
    return localItems.map((i) => Number(i.price)).filter((p) => !isNaN(p)) || []
  }, [localItems])

  const minPrice = useMemo(() => (prices.length ? Math.min(...prices) : 0), [prices])
  const maxPrice = useMemo(() => (prices.length ? Math.max(...prices) : 0), [prices])

  const totalPartsCount = useMemo(() => localItems.length, [localItems])
  const totalSoldPartsCount = useMemo(() => localItems.filter(i => i.status === 'sold').length, [localItems])

  // Toggle solid/sold status in real-time or revert to available and notify followers
  const handleToggleSold = async (id: string, currentStatus: string) => {
    setStatusUpdatingId(id)
    const targetStatus = currentStatus === 'sold' ? 'available' : 'sold'
    
    try {
      const { error } = await supabase
        .from('halfcut_items')
        .update({ status: targetStatus })
        .eq('id', id)

      if (error) throw error

      setLocalItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: targetStatus } : i))
      )
      toast.success(
        targetStatus === 'sold'
          ? 'Part marked as SOLD! Followers notified.'
          : 'Part is back to AVAILABLE! Followers notified.'
      )
    } catch (err: any) {
      toast.error('Could not modify status: ' + err.message)
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const handleModalSaveSuccess = async () => {
    // Reload items list
    const { data, error } = await supabase
      .from('halfcut_items')
      .select('*')
      .eq('halfcut_id', halfcut.id)
    
    if (!error && data) {
      setLocalItems(data)
    }
    setEditingItem(null)
  }

  // Filter and sort items list
  const filteredAndSortedItems = useMemo(() => {
    let items = [...localItems]

    // Search filter
    const searchString = q.trim().toLowerCase()
    if (searchString) {
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchString) ||
          (item.oem_part_number && item.oem_part_number.toLowerCase().includes(searchString)) ||
          (item.description && item.description.toLowerCase().includes(searchString))
      )
    }

    // Sort operations
    if (sortBy === 'price-asc') {
      items.sort((a, b) => Number(a.price) - Number(b.price))
    } else if (sortBy === 'price-desc') {
      items.sort((a, b) => Number(b.price) - Number(a.price))
    } else if (sortBy === 'alphabetical') {
      items.sort((a, b) => a.title.localeCompare(b.title))
    }

    return items
  }, [localItems, q, sortBy])

  // WhatsApp helper link
  const makeWaUrl = (item?: HalfcutItem) => {
    const waPhone = halfcut.contact ? halfcut.contact.replace(/[^0-9]/g, '') : ''
    const msg = item
      ? `Hi, I'm interested in the part: "${item.title}" (Price: RM ${Math.floor(item.price).toLocaleString()})${item.oem_part_number ? ' [OEM: ' + item.oem_part_number + ']' : ''} from your listing: "${halfcut.title}". Is it still available?`
      : `Hi, I'm interested in your donor halfcut listing: "${halfcut.title}".`
    return `https://wa.me/${waPhone.startsWith('60') || waPhone.startsWith('1') ? waPhone : '6' + waPhone}?text=${encodeURIComponent(msg)}`
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 max-w-7xl mx-auto">
      {/* Navigation and Back Arrow */}
      <div>
        <Link
          href="/halfcuts"
          className="inline-flex items-center gap-2 text-primary hover:text-white font-bold text-xs uppercase tracking-wider transition-colors mb-4 group"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Directory
        </Link>
      </div>

      {/* Main Donor Brief Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-surface/50 border border-slate-800/80 rounded-3xl p-6 lg:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Glow decorative bounds */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        {/* Column 1 & 2: Listing Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-[10px] font-black tracking-widest text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md uppercase"
                style={{ fontFamily: 'var(--font-orbitron)' }}
              >
                Donor Vehicle Kit
              </span>
              <span className="text-[10px] bg-slate-800 font-bold border border-slate-700/60 text-text-secondary px-2.5 py-1 rounded-md uppercase">
                {localItems.length} Parts Stripped
              </span>
              {isOwner && (
                <span className="text-[10px] bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold px-2.5 py-1 rounded-md uppercase">
                  Listing Owner Console
                </span>
              )}
            </div>
            <h1
              className="text-2xl sm:text-3xl font-black text-white leading-tight gradient-text"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              {halfcut.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-secondary">
              {halfcut.location && (
                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin size={15} className="text-primary" />
                  {halfcut.location}
                </span>
              )}
              {halfcut.contact && (
                <span className="flex items-center gap-1.5 font-medium">
                  <Phone size={15} className="text-teal-400" />
                  {halfcut.contact}
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-text-secondary leading-relaxed max-w-3xl">
            This premium donor vehicle package has been logged, cataloged, and stripped down by the owner. Browse and compare mechanical core parts, luxury interior setup trims, harness pins, and body elements below. Connect directly with the seller for immediate package deals or custom towing freight bookings.
          </p>

          {/* Pricing spectrum stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 border-t border-slate-800/60">
            <div className="bg-black/30 border border-slate-850 p-3 rounded-2xl">
              <span className="text-[10px] text-text-muted font-bold block uppercase tracking-wider">Catalog Value</span>
              <span className="text-sm font-extrabold text-white text-primary mt-1 block">
                RM {(prices.reduce((sum, val) => sum + val, 0)).toLocaleString()}
              </span>
            </div>
            <div className="bg-black/30 border border-slate-850 p-3 rounded-2xl">
              <span className="text-[10px] text-text-muted font-bold block uppercase tracking-wider">Price Min</span>
              <span className="text-sm font-extrabold text-white mt-1 block">
                RM {minPrice.toLocaleString()}
              </span>
            </div>
            <div className="bg-black/30 border border-slate-850 p-3 rounded-2xl">
              <span className="text-[10px] text-text-muted font-bold block uppercase tracking-wider">Price Max</span>
              <span className="text-sm font-extrabold text-white mt-1 block">
                RM {maxPrice.toLocaleString()}
              </span>
            </div>
            <div className="bg-black/30 border border-slate-850 p-3 rounded-2xl">
              <span className="text-[10px] text-text-muted font-bold block uppercase tracking-wider">Total Parts</span>
              <span className="text-sm font-extrabold text-white mt-1 block font-mono">
                {totalPartsCount} items
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-black/30 border border-slate-850 p-3 rounded-2xl">
              <span className="text-[10px] text-text-muted font-bold block uppercase tracking-wider">Total Sold</span>
              <span className="text-sm font-extrabold text-emerald-400 mt-1 block font-mono flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {totalSoldPartsCount} / {totalPartsCount} ({totalPartsCount > 0 ? Math.round((totalSoldPartsCount / totalPartsCount) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* Column 3: Seller Contact & Quick Actions Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3
              className="text-xs font-bold text-white uppercase tracking-widest pb-2 border-b border-slate-800"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              Seller Profile
            </h3>
            <div className="flex items-center gap-3">
              {halfcut.users?.avatar_url ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-slate-700 bg-surface">
                  <Image
                    src={halfcut.users.avatar_url}
                    alt={halfcut.users.display_name || 'Seller'}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 border border-slate-700 rounded-full flex items-center justify-center bg-surface overflow-hidden">
                  <DefaultAvatar className="w-10 h-12 text-primary translate-y-1.5" />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-white">
                  {halfcut.users?.display_name || 'Verified Member'}
                </p>
                <p className="text-xs text-text-muted font-semibold">
                  @{halfcut.users?.username || 'user'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href={makeWaUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center py-3 bg-[#25D366] hover:bg-[#20ba4e] text-black font-extrabold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-colors duration-200"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              <Phone size={15} /> WhatsApp Seller
            </a>
            {halfcut.contact && (
              <a
                href={`tel:${halfcut.contact}`}
                className="w-full text-center py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors duration-200"
                style={{ fontFamily: 'var(--font-orbitron)' }}
              >
                Direct Call Client
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Parts Search and Filter Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 pb-2 border-b border-slate-800">
        <div>
          <h2
            className="text-lg font-bold text-white tracking-wide"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            Stripped Spare Parts Inventory
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Showing {filteredAndSortedItems.length} of {localItems.length} listed spares
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Quick Search Input */}
          <div className="relative flex items-center bg-surface border border-slate-800/80 rounded-xl overflow-hidden w-full sm:w-64">
            <div className="pl-3.5">
              <Search className="h-4 w-4 text-text-muted" />
            </div>
            <input
              type="text"
              placeholder="Search parts catalog..."
              className="w-full h-10 px-2.5 text-xs text-white bg-transparent outline-none placeholder-text-muted"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button
                onClick={() => setQ('')}
                className="p-1.5 mr-2 rounded-full hover:bg-slate-700/40 text-text-muted hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Sorter Selector */}
          <div className="relative flex items-center bg-surface border border-slate-800/80 rounded-xl overflow-hidden px-3 gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
            <select
              className="h-10 text-xs text-white bg-transparent border-none outline-none cursor-pointer pr-3 py-1.5 font-bold uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-orbitron)' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="default" className="bg-slate-900">Default Catalog</option>
              <option value="price-asc" className="bg-slate-900">Price: Low to High</option>
              <option value="price-desc" className="bg-slate-900">Price: High to Low</option>
              <option value="alphabetical" className="bg-slate-900">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Parts List - One Card per Row Layout! (Optimized UI/UX Row cards matching demand) */}
      {filteredAndSortedItems.length === 0 ? (
        <div className="text-center py-20 text-text-muted border border-slate-850 rounded-2xl bg-surface/20">
          <Layers size={40} className="mx-auto mb-3 opacity-20 text-primary" />
          <p className="text-sm font-bold text-white">No catalog parts match your criteria</p>
          <p className="text-xs mt-1">Try resetting the search terms above or tweaking keywords</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedItems.map((item) => {
            const images = item.images_gallery as string[] | undefined
            const hasCustomImage = images && images.length > 0 && images[0]
            const coverImg = hasCustomImage ? images[0] : '/cover-image/halfcut-default.jpg'

            return (
              <div
                key={item.id}
                className={`flex flex-col md:flex-row bg-surface border rounded-2xl overflow-hidden p-4 gap-5 transition-all group relative ${
                  item.status === 'sold'
                    ? 'border-red-905/30 bg-black/40 hover:border-red-900/40 opacity-75'
                    : 'border-slate-800/80 hover:border-slate-700/80 hover:shadow-[0_0_20px_rgba(6,182,212,0.02)]'
                }`}
              >
                {/* 1. Cover Image Section (Square aspect scale) */}
                <div className="relative aspect-square w-full md:w-36 h-40 md:h-36 shrink-0 bg-black/40 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                  <SafeImage
                    src={coverImg}
                    alt={item.title}
                    fill
                    sizes="150px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                    onClick={() => setActiveImageModal(coverImg)}
                  />
                  
                  {/* SOLD banner watermark */}
                  {item.status === 'sold' && (
                    <div className="absolute inset-0 bg-red-950/70 backdrop-blur-[2px] flex items-center justify-center">
                      <span
                        className="text-white text-xs font-black tracking-widest uppercase border-2 border-red-500 rounded px-2.5 py-0.5 bg-red-650/40"
                        style={{ fontFamily: 'var(--font-orbitron)' }}
                      >
                        SOLD
                      </span>
                    </div>
                  )}

                  {images && images.length > 1 && (
                    <span className="absolute bottom-2 right-2 bg-black/85 text-[8px] font-black text-white px-1.5 py-0.5 rounded tracking-wider border border-white/5">
                      + {images.length - 1} MORE
                    </span>
                  )}
                </div>

                {/* 2. Middle Block: Core textual context (Spans full workspace width dynamically) */}
                <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1">
                      <h3 className={`text-base font-extrabold transition-colors leading-snug ${
                        item.status === 'sold' ? 'text-slate-400 line-through' : 'text-white group-hover:text-primary'
                      }`}>
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {item.oem_part_number && (
                          <div className="inline-flex items-center gap-1.5 text-[9px] font-bold text-text-muted bg-slate-850 px-2 py-0.5 rounded-md border border-slate-800 shrink-0 self-start sm:self-auto uppercase tracking-wide">
                            <span className="text-[8px] text-white">OEM</span>
                            <span className="font-mono font-bold select-all">{item.oem_part_number}</span>
                          </div>
                        )}
                        {item.status === 'sold' && (
                          <span className="text-[8px] bg-red-950 border border-red-800 text-red-400 font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>

                    <p className={`text-xs leading-relaxed pr-2 line-clamp-3 select-text ${
                      item.status === 'sold' ? 'text-slate-500' : 'text-text-secondary'
                    }`}>
                      {item.description ? item.description : 'No description provided for this component.'}
                    </p>
                  </div>

                  <div className="pt-3 flex items-center gap-3 text-[10px] text-text-muted font-medium border-t border-slate-800/40">
                    <span className="flex items-center gap-1 font-mono">
                      ID: {item.id.split('-')[0].toUpperCase()}
                    </span>
                    <span>•</span>
                    <button
                      onClick={() => setActiveImageModal(coverImg)}
                      className="text-primary font-bold hover:underline"
                    >
                      Inspect Gallery View
                    </button>
                    {isOwner && (
                      <>
                        <span>•</span>
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1"
                        >
                          <Edit size={11} /> Edit Specs
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 3. Right Block: Price + WhatsApp Inquiry Trigger (Vertical column alignment) */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center p-3 md:p-1 bg-slate-900/30 md:bg-transparent rounded-xl border border-slate-800/40 md:border-0 gap-4 md:w-56 shrink-0 self-stretch border-t">
                  <div className="text-left md:text-right">
                    <span className="text-[9px] font-extrabold text-text-muted block uppercase tracking-wider">Part Price</span>
                    <span
                      className={`text-xl font-black tracking-tight block mt-0.5 ${
                        item.status === 'sold' ? 'text-slate-500' : 'text-primary'
                      }`}
                      style={{ fontFamily: 'var(--font-orbitron)' }}
                    >
                      RM {Math.floor(item.price).toLocaleString('en-US')}
                    </span>
                  </div>

                  {isOwner ? (
                    <button
                      disabled={statusUpdatingId === item.id}
                      onClick={() => handleToggleSold(item.id, item.status || 'available')}
                      className={`px-4 py-2.5 rounded-xl text-[10px] font-extrabold tracking-widest uppercase flex items-center gap-1.5 transition-all select-none self-stretch sm:self-auto justify-center ${
                        item.status === 'sold'
                          ? 'bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-850/60 text-emerald-450'
                          : 'bg-red-950/20 hover:bg-red-950/40 border border-red-850/60 text-red-450'
                      }`}
                      style={{ fontFamily: 'var(--font-orbitron)' }}
                    >
                      {statusUpdatingId === item.id ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : item.status === 'sold' ? (
                        <>Make Available</>
                      ) : (
                        <>Make Sold</>
                      )}
                    </button>
                  ) : item.status === 'sold' ? (
                    <button
                      disabled
                      className="px-4 py-2.5 bg-slate-850 border border-slate-800 text-slate-500 rounded-xl text-[10px] font-extrabold tracking-widest uppercase flex items-center gap-1.5 select-none self-stretch sm:self-auto justify-center cursor-not-allowed"
                      style={{ fontFamily: 'var(--font-orbitron)' }}
                    >
                      Not Available
                    </button>
                  ) : (
                    <a
                      href={makeWaUrl(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 hover:border-[#25D366]/60 text-[#25D366] rounded-xl text-[10px] font-extrabold tracking-widest uppercase flex items-center gap-1.5 transition-all select-none self-stretch sm:self-auto justify-center"
                      style={{ fontFamily: 'var(--font-orbitron)' }}
                    >
                      Inquire Part
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox Modal Frame Zoom element */}
      {activeImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={() => setActiveImageModal(null)}
          />
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center justify-center bg-black">
            <button
              onClick={() => setActiveImageModal(null)}
              className="absolute top-4 right-4 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-colors border border-border/20 z-10"
              title="Close Image Modal"
            >
              <X size={18} />
            </button>
            <div className="relative w-full h-[70vh] aspect-video">
              <Image
                src={activeImageModal}
                alt="Zoomed Detail"
                fill
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Component Specs Modal */}
      {isOwner && editingItem && (
        <EditHalfcutItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={handleModalSaveSuccess}
        />
      )}
    </div>
  )
}