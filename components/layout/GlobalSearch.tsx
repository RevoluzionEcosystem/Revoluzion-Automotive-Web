'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, X, Users, Wrench, CalendarDays, Tag, Package, ShoppingCart } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { cn } from '@/lib/utils'

type FilterKey = 'members' | 'builds' | 'events' | 'marketplace' | 'products'

const ALL_FILTERS: { id: FilterKey; label: string; icon: React.ElementType }[] = [
  { id: 'members',     label: 'Members',     icon: Users },
  { id: 'products',    label: 'Products',    icon: Package },
  { id: 'builds',      label: 'Builds',      icon: Wrench },
  { id: 'events',      label: 'Events',      icon: CalendarDays },
  { id: 'marketplace', label: 'Marketplace', icon: Tag },
]

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [active, setActive] = useState<Set<FilterKey>>(new Set())
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 350)
    return () => clearTimeout(t)
  }, [query])

  // Close on outside click / Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() } }
    function onClick(e: MouseEvent) { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick) }
  }, [])

  const enabled = debounced.trim().length >= 2
  const show = (id: FilterKey) => active.size === 0 || active.has(id)

  function toggleFilter(id: FilterKey) {
    setActive(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const { data: members = [] } = useQuery({
    queryKey: ['gs-members', debounced],
    queryFn: async () => {
      const { data } = await supabase.from('profiles')
        .select('id, username, display_name, avatar_url, is_verified')
        .or(`username.ilike.%${debounced}%,display_name.ilike.%${debounced}%`).limit(5)
      return data ?? []
    },
    enabled: enabled && show('members'),
    staleTime: 30000,
  })

  const { data: products = [] } = useQuery({
    queryKey: ['gs-products', debounced],
    queryFn: async () => {
      const tokens = debounced.trim().toLowerCase().split(/\s+/).filter(Boolean)
      let q = supabase.from('products')
        .select('id, name, slug, sku_public, price_retail, product_images(url, sort_order)')
        .eq('is_published', true).eq('is_deleted', false)
      // search name + sku
      q = q.or(`name.ilike.%${tokens.join('%')}%,sku_public.ilike.%${tokens[0]}%`)
      const { data } = await q.limit(6)
      return (data ?? []).map((p: any) => ({
        ...p,
        imageUrl: ((p.product_images ?? []) as any[]).sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null,
      }))
    },
    enabled: enabled && show('products'),
    staleTime: 30000,
  })

  const { data: builds = [] } = useQuery({
    queryKey: ['gs-builds', debounced],
    queryFn: async () => {
      const { data } = await supabase.from('builds')
        .select('id, title, image_url, profiles(username, display_name)')
        .ilike('title', `%${debounced}%`).limit(5)
      return data ?? []
    },
    enabled: enabled && show('builds'),
    staleTime: 30000,
  })

  const { data: events = [] } = useQuery({
    queryKey: ['gs-events', debounced],
    queryFn: async () => {
      const { data } = await supabase.from('events')
        .select('id, title, date, location, price').ilike('title', `%${debounced}%`).limit(5)
      return data ?? []
    },
    enabled: enabled && show('events'),
    staleTime: 30000,
  })

  const { data: listings = [] } = useQuery({
    queryKey: ['gs-listings', debounced],
    queryFn: async () => {
      const { data } = await supabase.from('marketplace_listings')
        .select('id, title, price, condition, marketplace_images(image_url, sort_order)')
        .ilike('title', `%${debounced}%`).eq('status', 'active').limit(5)
      return data ?? []
    },
    enabled: enabled && show('marketplace'),
    staleTime: 30000,
  })

  const total = members.length + products.length + builds.length + events.length + listings.length

  function close() { setOpen(false); setQuery(''); inputRef.current?.blur() }

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search builds, events, members, products..."
          className="input pl-10 pr-9 py-2.5 text-sm bg-surface w-full"
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button onClick={() => { setQuery(''); setDebounced(''); inputRef.current?.focus() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Filter pills */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border flex-wrap">
            <span className="text-[11px] text-text-muted mr-1">Filter:</span>
            {ALL_FILTERS.map(({ id, label, icon: Icon }) => {
              const on = active.has(id)
              return (
                <button key={id} onClick={() => toggleFilter(id)}
                  className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                    on ? 'bg-primary text-black border-primary' : 'bg-surface-variant text-text-secondary border-border hover:border-primary/40'
                  )}>
                  <Icon size={10} />{label}
                </button>
              )
            })}
            {active.size > 0 && (
              <button onClick={() => setActive(new Set())} className="text-[11px] text-red-400 hover:text-red-300 ml-1">Clear</button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[85vh] overflow-y-auto">
            {!enabled ? (
              <p className="text-center text-text-muted text-sm py-8">Type at least 2 characters…</p>
            ) : total === 0 ? (
              <div className="text-center py-10">
                <Search size={32} className="mx-auto mb-2 text-primary/20" />
                <p className="text-text-muted text-sm">No results for &ldquo;{debounced}&rdquo;</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {/* Products */}
                {show('products') && products.length > 0 && (
                  <div className="p-3">
                    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest px-2 mb-2 flex items-center gap-1.5"><Package size={10} /> Products</p>
                    <div className="space-y-0.5">
                      {(products as any[]).map((p) => (
                        <Link key={p.id} href={`/shop/${p.slug ?? p.id}`} onClick={close}
                          className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-variant transition-colors group">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-variant shrink-0">
                            {p.imageUrl
                              ? <Image src={p.imageUrl} alt={p.name} width={40} height={40} className="w-full h-full object-cover" />
                              : <Package size={14} className="text-primary/20 m-auto" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate group-hover:text-primary transition-colors">{p.name}</p>
                            <p className="text-[11px] text-text-muted font-mono">{p.sku_public}</p>
                          </div>
                          <span className="price-srp text-sm shrink-0">{formatCurrency(p.price_retail)}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {/* Members */}
                {show('members') && members.length > 0 && (
                  <div className="p-3">
                    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest px-2 mb-2 flex items-center gap-1.5"><Users size={10} /> Members</p>
                    <div className="space-y-0.5">
                      {(members as any[]).map((m) => (
                        <Link key={m.id} href={`/u/${m.username}`} onClick={close}
                          className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-variant transition-colors group">
                          {m.avatar_url
                            ? <Image src={m.avatar_url} alt="" width={36} height={36} className="w-9 h-9 rounded-full object-cover border border-border shrink-0" />
                            : <DefaultAvatar className="w-9 h-9 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">{m.display_name || m.username}</p>
                            <p className="text-[11px] text-text-muted">@{m.username}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {/* Builds */}
                {show('builds') && builds.length > 0 && (
                  <div className="p-3">
                    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest px-2 mb-2 flex items-center gap-1.5"><Wrench size={10} /> Builds</p>
                    <div className="space-y-0.5">
                      {(builds as any[]).map((b) => (
                        <Link key={b.id} href={`/builds/${b.id}`} onClick={close}
                          className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-variant transition-colors group">
                          {b.image_url
                            ? <Image src={b.image_url} alt={b.title} width={40} height={32} className="w-10 h-8 rounded-lg object-cover shrink-0" />
                            : <div className="w-10 h-8 rounded-lg bg-surface-variant shrink-0" />}
                          <p className="text-sm text-text-primary group-hover:text-primary transition-colors truncate">{b.title}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {/* Events */}
                {show('events') && events.length > 0 && (
                  <div className="p-3">
                    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest px-2 mb-2 flex items-center gap-1.5"><CalendarDays size={10} /> Events</p>
                    <div className="space-y-0.5">
                      {(events as any[]).map((e) => (
                        <Link key={e.id} href={`/events/${e.id}`} onClick={close}
                          className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-variant transition-colors group">
                          <div className="w-10 h-8 rounded-lg bg-surface-variant flex items-center justify-center shrink-0">
                            <CalendarDays size={14} className="text-primary/50" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-text-primary group-hover:text-primary transition-colors truncate">{e.title}</p>
                            {e.date && <p className="text-[11px] text-text-muted">{formatDate(e.date)}{e.location ? ` · ${e.location}` : ''}</p>}
                          </div>
                          <span className="text-primary text-sm font-semibold shrink-0">{e.price > 0 ? formatCurrency(e.price) : 'Free'}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {/* Marketplace */}
                {show('marketplace') && listings.length > 0 && (
                  <div className="p-3">
                    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest px-2 mb-2 flex items-center gap-1.5"><Tag size={10} /> Marketplace</p>
                    <div className="space-y-0.5">
                      {(listings as any[]).map((l) => {
                        const img = (l.marketplace_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.image_url
                        return (
                          <Link key={l.id} href={`/marketplace/${l.id}`} onClick={close}
                            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-variant transition-colors group">
                            {img
                              ? <Image src={img} alt={l.title} width={40} height={32} className="w-10 h-8 rounded-lg object-cover shrink-0" />
                              : <div className="w-10 h-8 rounded-lg bg-surface-variant shrink-0" />}
                            <p className="text-sm text-text-primary group-hover:text-primary transition-colors truncate flex-1">{l.title}</p>
                            <span className="price-srp text-sm shrink-0">{formatCurrency(l.price)}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {enabled && total > 0 && (
            <div className="border-t border-border px-4 py-2.5">
              <p className="text-xs text-text-muted">{total} result{total !== 1 ? 's' : ''} for &ldquo;{debounced}&rdquo;</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}