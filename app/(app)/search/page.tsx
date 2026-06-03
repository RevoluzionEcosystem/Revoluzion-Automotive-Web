'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { Search, Users, Wrench, CalendarDays, Tag } from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { timeAgo, getInitials, formatDate, formatCurrency } from '@/lib/utils'
import { useSearchParams, useRouter } from 'next/navigation'

type SearchTab = 'all' | 'members' | 'builds' | 'events' | 'marketplace'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const [tab, setTab] = useState<SearchTab>('all')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      if (query) router.replace(`/search?q=${encodeURIComponent(query)}`, { scroll: false })
    }, 400)
    return () => clearTimeout(timer)
  }, [query, router])

  const enabled = debouncedQuery.trim().length >= 2

  const { data: members = [] } = useQuery({
    queryKey: ['search-members', debouncedQuery],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, location, is_verified, followers_count')
        .or(`username.ilike.%${debouncedQuery}%,display_name.ilike.%${debouncedQuery}%`)
        .limit(10)
      return data ?? []
    },
    enabled,
  })

  const { data: builds = [] } = useQuery({
    queryKey: ['search-builds', debouncedQuery],
    queryFn: async () => {
      const { data } = await supabase
        .from('builds')
        .select('id, title, image_url, likes_count, created_at, profiles(username, display_name)')
        .ilike('title', `%${debouncedQuery}%`)
        .limit(10)
      return data ?? []
    },
    enabled,
  })

  const { data: events = [] } = useQuery({
    queryKey: ['search-events', debouncedQuery],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('id, title, date, location, category, price, banner_url')
        .ilike('title', `%${debouncedQuery}%`)
        .limit(10)
      return data ?? []
    },
    enabled,
  })

  const { data: listings = [] } = useQuery({
    queryKey: ['search-listings', debouncedQuery],
    queryFn: async () => {
      const { data } = await supabase
        .from('marketplace_listings')
        .select('id, title, price, condition, marketplace_images(image_url, sort_order)')
        .ilike('title', `%${debouncedQuery}%`)
        .eq('status', 'active')
        .limit(10)
      return data ?? []
    },
    enabled,
  })

  const TABS: { id: SearchTab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: 'All', icon: <Search size={14} />, count: members.length + builds.length + events.length + listings.length },
    { id: 'members', label: 'Members', icon: <Users size={14} />, count: members.length },
    { id: 'builds', label: 'Builds', icon: <Wrench size={14} />, count: builds.length },
    { id: 'events', label: 'Events', icon: <CalendarDays size={14} />, count: events.length },
    { id: 'marketplace', label: 'Marketplace', icon: <Tag size={14} />, count: listings.length },
  ]

  const showMembers = tab === 'all' || tab === 'members'
  const showBuilds = tab === 'all' || tab === 'builds'
  const showEvents = tab === 'all' || tab === 'events'
  const showListings = tab === 'all' || tab === 'marketplace'

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-text-primary mb-5">Search</h1>

      {/* Search input */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members, builds, events, parts..."
          className="input pl-11 py-3 text-base"
          autoFocus
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
              tab === t.id
                ? 'bg-primary text-black border-primary'
                : 'bg-surface text-text-secondary border-border hover:border-primary/50'
            }`}
          >
            {t.icon}
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0 rounded-full ${tab === t.id ? 'bg-black/20' : 'bg-surface-variant'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {!enabled && (
        <div className="text-center py-16 text-text-muted">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p>Type at least 2 characters to search</p>
        </div>
      )}

      {enabled && (
        <div className="space-y-8">
          {/* Members */}
          {showMembers && members.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">Members</h2>
              <div className="space-y-2">
                {members.map((m: any) => (
                  <Link key={m.id} href={`/u/${m.username}`} className="card-hover p-3 flex items-center gap-3">
                    {m.avatar_url ? (
                      <Image src={m.avatar_url} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover border border-border" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-sm font-bold">
                        {getInitials(m.display_name || m.username || 'U')}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-text-primary text-sm">{m.display_name || m.username}</div>
                      <div className="text-text-muted text-xs">@{m.username}{m.location ? ` · ${m.location}` : ''}</div>
                    </div>
                    {m.is_verified && <span className="badge-primary ml-auto text-xs">Verified</span>}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Builds */}
          {showBuilds && builds.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">Builds</h2>
              <div className="space-y-2">
                {builds.map((b: any) => (
                  <Link key={b.id} href={`/builds/${b.id}`} className="card-hover p-3 flex items-center gap-3">
                    {b.image_url ? (
                      <Image src={b.image_url} alt={b.title} width={56} height={40} className="w-14 h-10 rounded-lg object-cover border border-border shrink-0" />
                    ) : (
                      <div className="w-14 h-10 rounded-lg bg-surface-variant flex items-center justify-center shrink-0">
                        <Wrench size={16} className="text-primary/40" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-text-primary text-sm">{b.title}</div>
                      <div className="text-text-muted text-xs">by {b.profiles?.display_name || b.profiles?.username} · {b.likes_count} likes</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Events */}
          {showEvents && events.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">Events</h2>
              <div className="space-y-2">
                {events.map((e: any) => (
                  <Link key={e.id} href={`/events/${e.id}`} className="card-hover p-3 flex items-center gap-3">
                    <div className="w-14 h-10 rounded-lg bg-surface-variant flex items-center justify-center shrink-0">
                      <CalendarDays size={16} className="text-primary/60" />
                    </div>
                    <div>
                      <div className="font-medium text-text-primary text-sm">{e.title}</div>
                      <div className="text-text-muted text-xs">
                        {e.date ? formatDate(e.date) : 'Date TBD'}{e.location ? ` · ${e.location}` : ''}
                      </div>
                    </div>
                    <span className="ml-auto text-primary text-sm font-semibold shrink-0">
                      {e.price > 0 ? formatCurrency(e.price) : 'Free'}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Marketplace */}
          {showListings && listings.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">Marketplace</h2>
              <div className="space-y-2">
                {listings.map((l: any) => {
                  const img = l.marketplace_images?.sort((a: any, b: any) => a.sort_order - b.sort_order)?.[0]?.image_url
                  return (
                    <Link key={l.id} href={`/marketplace/${l.id}`} className="card-hover p-3 flex items-center gap-3">
                      {img ? (
                        <Image src={img} alt={l.title} width={56} height={40} className="w-14 h-10 rounded-lg object-cover border border-border shrink-0" />
                      ) : (
                        <div className="w-14 h-10 rounded-lg bg-surface-variant flex items-center justify-center shrink-0">
                          <Tag size={16} className="text-primary/40" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-text-primary text-sm">{l.title}</div>
                        {l.condition && <div className="text-text-muted text-xs">{l.condition}</div>}
                      </div>
                      <span className="ml-auto text-primary font-bold text-sm shrink-0">{formatCurrency(l.price)}</span>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* No results */}
          {enabled && members.length === 0 && builds.length === 0 && events.length === 0 && listings.length === 0 && (
            <div className="text-center py-16 text-text-muted">
              <Search size={40} className="mx-auto mb-3 opacity-30" />
              <p>No results for &quot;{debouncedQuery}&quot;</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
