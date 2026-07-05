'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, X, MapPin, Phone, Layers, ArrowRight, Edit, Edit2 } from 'lucide-react'
import type { HalfcutWithUser, HalfcutItem } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  halfcuts: HalfcutWithUser[]
  initialQuery: string
}

export function HalfcutsClientList({ halfcuts, initialQuery }: Props) {
  const [q, setQ] = useState(initialQuery)
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null)
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
  const filteredListings = halfcuts.filter((hc) => {
    const cleanSearch = q.trim().toLowerCase()
    if (!cleanSearch) return true

    // Check main parent title, location
    const matchParent = 
      hc.title.toLowerCase().includes(cleanSearch) || 
      (hc.location && hc.location.toLowerCase().includes(cleanSearch))

    // Check any included part's title, oem part number or description
    const matchChildren = hc.halfcut_items?.some((item) => 
      item.title.toLowerCase().includes(cleanSearch) ||
      (item.oem_part_number && item.oem_part_number.toLowerCase().includes(cleanSearch)) ||
      (item.description && item.description.toLowerCase().includes(cleanSearch))
    )

    return matchParent || matchChildren
  })

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
        <div className="space-y-8 max-w-7xl mx-auto">
          {filteredListings.map((hc) => {
            const itemsList = hc.halfcut_items || []
            const waPhone = hc.contact ? hc.contact.replace(/[^0-9]/g, '') : ''
            const waUrl = hc.contact 
              ? `https://wa.me/${waPhone.startsWith('60') || waPhone.startsWith('1') ? waPhone : '6' + waPhone}?text=Hi,%20I'm%20interested%20in%20your%20halfcut%20listing:%20${encodeURIComponent(hc.title)}`
              : null

            return (
              <div 
                key={hc.id} 
                className="bg-surface border border-slate-800 rounded-2xl overflow-hidden shadow-xl"
              >
                {/* Header listing bar */}
                <div className="p-4 bg-gradient-to-r from-slate-900 to-surface border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <span 
                      className="text-xs font-bold text-primary tracking-widest uppercase"
                      style={{ fontFamily: 'var(--font-orbitron)' }}
                    >
                      Halfcut Donor Package
                    </span>
                    <h2 className="text-lg font-bold text-white leading-tight">
                      {hc.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                      {hc.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-primary" />
                          {hc.location}
                        </span>
                      )}
                      {hc.contact && (
                        <span className="flex items-center gap-1.5">
                          <Phone size={14} className="text-teal-400" />
                          {hc.contact}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Core Actions */}
                  <div className="flex gap-2 shrink-0 self-start md:self-center">
                    {sessionUserId === hc.user_id && (
                      <Link
                        href={`/halfcuts/edit/${hc.id}`}
                        className="inline-flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all"
                      >
                        <Edit2 size={13} /> Edit Bundle
                      </Link>
                    )}

                    {/* Immediate WhatsApp connect action */}
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 hover:border-[#25D366]/60 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all"
                      >
                        <Phone size={14} /> Contact Seller
                      </a>
                    )}
                  </div>
                </div>

                {/* Sub items layout cards containing list items list */}
                <div className="p-5">
                  {itemsList.length === 0 ? (
                    <div className="text-center py-6 text-text-muted text-xs">
                      No matching individual strip-parts registered under this kit yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                      {itemsList.map((item: HalfcutItem) => {
                        const images = item.images_gallery as string[] | undefined
                        const coverImg = images?.[0] || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80'
                        
                        return (
                          <div 
                            key={item.id} 
                            // Exact standard height, identical height limits everywhere grid layout bounds
                            className="group flex flex-col bg-surface-variant/30 border border-slate-700/60 hover:border-slate-500/80 rounded-xl overflow-hidden h-[330px] transition-all"
                          >
                            {/* Graphic preview layout context (Optimized max size 200x200px or full ratio fitting) */}
                            <div className="relative h-44 w-full bg-black/40 border-b border-border/10 overflow-hidden flex items-center justify-center">
                              {/* Central 1:1 fitting bounds box keeping max 200x200px limits */}
                              <div className="relative aspect-square w-40 h-40 max-w-full max-h-full rounded-lg overflow-hidden border border-slate-800/80 group-hover:border-slate-500/30 transition-colors shadow-black/40 shadow-inner">
                                <Image
                                  src={coverImg}
                                  alt={item.title}
                                  fill
                                  sizes="160px"
                                  className="object-cover group-hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                                  onClick={() => setActiveImageModal(coverImg)}
                                />
                              </div>

                              {/* Multi-images badge indicator */}
                              {images && images.length > 1 && (
                                <span className="absolute bottom-2 right-2 bg-black/70 text-[9px] font-black text-white px-1.5 py-0.5 rounded tracking-wide border border-border/15">
                                  + {images.length - 1} MORE IMAGES
                                </span>
                              )}
                            </div>

                            {/* Descriptions set (Guaranteed 200 chars card heights and text limits, no truncated heights layout breaks) */}
                            <div className="p-3.5 flex-1 flex flex-col justify-between">
                              <div className="space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-white text-xs font-bold leading-normal tracking-wide group-hover:text-primary transition-colors line-clamp-1">
                                    {item.title}
                                  </h4>
                                  <span className="text-primary font-bold text-xs shrink-0 tracking-tight">
                                    RM {Math.floor(item.price).toLocaleString('en-US')}
                                  </span>
                                </div>

                                {item.oem_part_number && (
                                  <div className="text-[10px] text-text-muted flex items-center gap-1">
                                    <span className="font-extrabold uppercase text-[8px] bg-slate-800 px-1 rounded border border-border/20 text-white leading-relaxed">
                                      OEM
                                    </span>
                                    <span className="font-semibold select-all font-mono">
                                      {item.oem_part_number}
                                    </span>
                                  </div>
                                )}

                                <p 
                                  className="text-[11px] text-text-secondary leading-snug font-medium pr-1 select-text h-11 line-clamp-3 mb-1"
                                  style={{ fontFamily: 'var(--font-inter), sans-serif' }}
                                >
                                  {item.description ? item.description : 'No description'}
                                </p>
                              </div>

                              <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-text-muted">
                                <span>Gallery View available</span>
                                <button 
                                  onClick={() => setActiveImageModal(coverImg)}
                                  className="text-primary font-bold hover:underline inline-flex items-center gap-0.5 uppercase tracking-wide text-[9px]"
                                >
                                  Zoom <ArrowRight size={10} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox Modal frame popup inside standard screen viewport */}
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
    </div>
  )
}