'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Search, X, MapPin, Phone, Layers, ArrowRight, Edit2, ShieldCheck, Banknote } from 'lucide-react'
import { SafeImage } from '@/components/ui/SafeImage'
import type { HalfcutWithUser } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  halfcuts: HalfcutWithUser[]
  initialQuery: string
}

export function HalfcutsClientList({ halfcuts, initialQuery }: Props) {
  const [q, setQ] = useState(initialQuery)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchSession() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setSessionUserId(user.id)
      }
    }
    fetchSession()
  }, [supabase])

  // Client side matching for phonetic resilience
  const filteredListings = useMemo(() => {
    return halfcuts.filter((hc) => {
      const cleanSearch = q.trim().toLowerCase()
      if (!cleanSearch) return true

      // Check main parent title, location
      const matchParent =
        hc.title.toLowerCase().includes(cleanSearch) ||
        (hc.location && hc.location.toLowerCase().includes(cleanSearch))

      // Check any included part's title, oem part number or description
      const matchChildren = hc.halfcut_items?.some(
        (item) =>
          item.title.toLowerCase().includes(cleanSearch) ||
          (item.oem_part_number && item.oem_part_number.toLowerCase().includes(cleanSearch)) ||
          (item.description && item.description.toLowerCase().includes(cleanSearch))
      )

      return matchParent || matchChildren
    })
  }, [halfcuts, q])

  return (
    <div className="space-y-6">
      {/* Centered search input styled identically to Marketplace */}
      <div className="flex justify-center w-full px-4 sm:px-6">
        <form onSubmit={(e) => e.preventDefault()} className="relative w-full max-w-2xl group">
          <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center bg-surface/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="pl-4">
              <Search className="h-5 w-5 text-primary stroke-[2.5]" />
            </div>
            <input
              type="text"
              placeholder="Search halfcuts, donor models, engines, parts title, OEM codes..."
              className="w-full h-12 px-3 text-sm text-white bg-transparent outline-none placeholder-text-muted select-none"
              style={{ fontFamily: 'var(--font-inter), sans-serif' }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="p-1.5 mr-3 rounded-full hover:bg-slate-700/40 text-text-muted hover:text-white transition-colors"
                title="Clear Search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {filteredListings.length === 0 ? (
        <div className="text-center py-24 text-text-muted bg-surface/10 rounded-2xl border border-border/40 max-w-4xl mx-auto">
          <Layers size={48} className="mx-auto mb-4 opacity-20 text-primary" />
          <p className="text-lg font-semibold text-white">No halfcut bundles found</p>
          <p className="text-sm mt-1">Try tweaking your search term or register a new spare part list above!</p>
        </div>
      ) : (
        <div className="space-y-6 max-w-5xl mx-auto px-4 md:px-0">
          {filteredListings.map((hc) => {
            const itemsList = hc.halfcut_items || []
            const waPhone = hc.contact ? hc.contact.replace(/[^0-9]/g, '') : ''
            const waUrl = hc.contact
              ? `https://wa.me/${waPhone.startsWith('60') || waPhone.startsWith('1') ? waPhone : '6' + waPhone}?text=Hi,%20I'm%20interested%20in%20your%20halfcut%20listing:%20${encodeURIComponent(hc.title)}`
              : null

            // Prices calculation
            const itemPrices = itemsList.map((i) => Number(i.price)).filter((p) => !isNaN(p))
            const minPrice = itemPrices.length ? Math.min(...itemPrices) : 0
            const maxPrice = itemPrices.length ? Math.max(...itemPrices) : 0

            // Preview parts text list
            const featuredParts = itemsList.slice(0, 4).map((i) => i.title).join(', ')

            // Grab up to 4 photos to build a collage cover block
            const previewImages = itemsList
              .map((i) => (i.images_gallery as string[] | undefined)?.[0])
              .filter((x): x is string => !!x)
              .slice(0, 4)

            return (
              <div
                key={hc.id}
                className="bg-surface border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700/80 hover:shadow-2xl transition-all duration-300 grid grid-cols-1 md:grid-cols-4 shadow-xl"
              >
                {/* 1. Left Section: Interactive Collage cover */}
                <Link
                  href={`/halfcuts/${hc.id}`}
                  className="relative md:col-span-1 h-56 md:h-full min-h-[170px] bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800/85 overflow-hidden flex items-center justify-center group/collage shrink-0"
                >
                  {previewImages.length === 0 ? (
                    <div className="relative w-full h-full min-h-[150px]">
                      <SafeImage
                        src="/cover-image/halfcut-default.jpg"
                        alt="No Cover Image"
                        fill
                        className="object-cover opacity-50 group-hover/collage:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4">
                        <span className="text-white text-xs font-black tracking-widest uppercase bg-black/80 px-3 py-1.5 rounded-md border border-slate-700 shadow-2xl">
                          No Cover Image
                        </span>
                      </div>
                    </div>
                  ) : previewImages.length === 1 ? (
                    <div className="relative w-full h-full">
                      <SafeImage
                        src={previewImages[0]}
                        alt={hc.title}
                        fill
                        className="object-cover group-hover/collage:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : previewImages.length < 4 ? (
                    // Dual panel gallery layout
                    <div className="grid grid-cols-2 w-full h-full gap-0.5">
                      <div className="relative h-full">
                        <SafeImage src={previewImages[0]} alt="p0" fill className="object-cover" />
                      </div>
                      <div className="relative h-full">
                        <SafeImage src={previewImages[1] || previewImages[0]} alt="p1" fill className="object-cover" />
                      </div>
                    </div>
                  ) : (
                    // 2x2 grid collage block style! Perfectly advanced!
                    <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5 bg-black/40">
                      {previewImages.map((img, idx) => (
                        <div key={idx} className="relative h-full w-full">
                          <SafeImage
                            src={img}
                            alt={`Grid preview ${idx}`}
                            fill
                            className="object-cover opacity-80 hover:opacity-100 transition-opacity"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Absolute visual stats badge on collage */}
                  <span className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-[9px] font-black text-primary px-2.5 py-1 rounded-md border border-primary/20 tracking-wider">
                    {itemsList.length} COMPONENT PARTS
                  </span>
                </Link>

                {/* 2. Middle Section: Key descriptive metadata (Spans 2 columns) */}
                <div className="md:col-span-2 p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span
                      className="text-[9px] font-bold text-primary tracking-widest uppercase block"
                      style={{ fontFamily: 'var(--font-orbitron)' }}
                    >
                      Premium Donor Package
                    </span>
                    <Link
                      href={`/halfcuts/${hc.id}`}
                      className="text-lg font-extrabold text-white hover:text-primary transition-colors leading-snug block select-text"
                    >
                      {hc.title}
                    </Link>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary pt-0.5">
                      {hc.location && (
                        <span className="flex items-center gap-1.5 font-medium">
                          <MapPin size={13} className="text-primary-light" />
                          {hc.location}
                        </span>
                      )}
                      {hc.contact && (
                        <span className="flex items-center gap-1.5 font-medium">
                          <Phone size={13} className="text-teal-400" />
                          {hc.contact}
                        </span>
                      )}
                    </div>

                    {/* Featured summary text block */}
                    {featuredParts && (
                      <p className="text-[11px] text-text-muted leading-relaxed font-medium pt-1">
                        <strong className="text-white">Contains:</strong> {featuredParts}... and more.
                      </p>
                    )}
                  </div>

                  {/* Pricing dynamic ranges with badges */}
                  <div className="flex items-center gap-4 pt-3 border-t border-slate-800/60 text-xs">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wide flex items-center gap-1">
                      <Banknote size={14} className="text-primary" /> Spares Price Range:
                    </span>
                    <span className="font-extrabold text-white">
                      RM {minPrice.toLocaleString()} — RM {maxPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 3. Right Section: CTA triggers panel */}
                <div className="p-6 bg-slate-900/30 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col justify-center space-y-3">
                  <Link
                    href={`/halfcuts/${hc.id}`}
                    className="w-full text-center py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-black border border-primary/30 hover:border-transparent rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-1.5"
                    style={{ fontFamily: 'var(--font-orbitron)' }}
                  >
                    View Spares <ArrowRight size={13} />
                  </Link>

                  {/* Immediate WhatsApp trigger */}
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center py-2.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/20 hover:border-[#25D366]/40 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-1.5 transition-colors"
                      style={{ fontFamily: 'var(--font-orbitron)' }}
                    >
                      <Phone size={13} /> Message Seller
                    </a>
                  )}

                  {/* Owner Controls */}
                  {sessionUserId === hc.user_id && (
                    <Link
                      href={`/halfcuts/edit/${hc.id}`}
                      className="w-full text-center py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest border border-slate-800 flex items-center justify-center gap-1.5 transition-colors"
                      style={{ fontFamily: 'var(--font-orbitron)' }}
                    >
                      <Edit2 size={11} /> Modify Package
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}