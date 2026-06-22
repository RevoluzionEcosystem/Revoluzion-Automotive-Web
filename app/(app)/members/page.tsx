'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { Users, Search, UserCheck, MapPin, SlidersHorizontal, X } from 'lucide-react'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import Image from 'next/image'
import Link from 'next/link'
import type { Profile } from '@/lib/supabase/types'

type SortKey = 'followers_desc' | 'followers_asc' | 'az' | 'za' | 'newest' | 'oldest'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'followers_desc', label: 'Most Followers' },
  { key: 'followers_asc', label: 'Fewest Followers' },
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'az', label: 'A–Z' },
  { key: 'za', label: 'Z–A' },
]

export default function MembersPage() {
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('followers_desc')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [founderOnly, setFounderOnly] = useState(false)
  const [locationFilter, setLocationFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', debouncedSearch],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('id, username, display_name, avatar_url, bio, location, is_verified, role, followers_count, following_count, created_at')
        .limit(200)

      if (debouncedSearch) {
        query = query.or(`username.ilike.%${debouncedSearch}%,display_name.ilike.%${debouncedSearch}%`)
      }

      const { data } = await query
      return (data ?? []) as Profile[]
    },
  })

  const filtered = useMemo(() => {
    let list = [...members]

    if (verifiedOnly) list = list.filter(m => m.is_verified)
    if (founderOnly) list = list.filter(m => m.role === 'founder')
    if (locationFilter.trim()) {
      const lf = locationFilter.toLowerCase()
      list = list.filter(m => m.location?.toLowerCase().includes(lf))
    }

    switch (sort) {
      case 'followers_desc': list.sort((a, b) => (b.followers_count ?? 0) - (a.followers_count ?? 0)); break
      case 'followers_asc': list.sort((a, b) => (a.followers_count ?? 0) - (b.followers_count ?? 0)); break
      case 'az': list.sort((a, b) => (a.display_name || a.username || '').localeCompare(b.display_name || b.username || '')); break
      case 'za': list.sort((a, b) => (b.display_name || b.username || '').localeCompare(a.display_name || a.username || '')); break
      case 'newest': list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break
      case 'oldest': list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break
    }

    return list
  }, [members, sort, verifiedOnly, founderOnly, locationFilter])

  const activeFilterCount = [verifiedOnly, founderOnly, locationFilter.trim() !== ''].filter(Boolean).length
  const hasActiveState = activeFilterCount > 0 || sort !== 'followers_desc'

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>Members</h1>
        <p className="text-text-muted text-sm mt-1">The Revoluzion community</p>
      </div>

      {/* Search + Filter toggle */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="input pl-9 text-sm w-full"
          />
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            showFilters || hasActiveState
              ? 'bg-primary/10 border-primary/50 text-primary'
              : 'bg-surface border-border text-text-secondary hover:border-border-light'
          }`}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary text-black text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card p-4 mb-4 space-y-4">
          <div>
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-2">Sort by</p>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSort(opt.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    sort === opt.key
                      ? 'bg-primary text-black border-primary'
                      : 'bg-surface-variant border-border text-text-secondary hover:border-border-light'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-2">Filter</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setVerifiedOnly(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  verifiedOnly
                    ? 'bg-primary text-black border-primary'
                    : 'bg-surface-variant border-border text-text-secondary hover:border-border-light'
                }`}
              >
                <UserCheck size={11} />
                Verified only
              </button>
              <button
                onClick={() => setFounderOnly(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  founderOnly
                    ? 'bg-primary text-black border-primary'
                    : 'bg-surface-variant border-border text-text-secondary hover:border-border-light'
                }`}
              >
                Founders only
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-2">Location</p>
            <div className="relative max-w-xs">
              <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={locationFilter}
                onChange={e => setLocationFilter(e.target.value)}
                placeholder="e.g. Kuala Lumpur"
                className="input pl-8 text-sm w-full"
              />
              {locationFilter && (
                <button
                  onClick={() => setLocationFilter('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {hasActiveState && (
            <button
              onClick={() => { setVerifiedOnly(false); setFounderOnly(false); setLocationFilter(''); setSort('followers_desc') }}
              className="text-xs text-primary hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>
      )}

      {!isLoading && (
        <p className="text-xs text-text-muted mb-4">{filtered.length} member{filtered.length !== 1 ? 's' : ''}</p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-surface-variant mx-auto mb-3" />
              <div className="h-3 bg-surface-variant rounded w-3/4 mx-auto mb-2" />
              <div className="h-2 bg-surface-variant rounded w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <Users size={48} className="mx-auto mb-4 opacity-30" />
          <p>No members found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((member) => (
            <Link key={member.id} href={`/u/${member.username}`} className="card-hover p-4 text-center group">
              {member.avatar_url ? (
                <Image
                  src={member.avatar_url}
                  alt={member.display_name || member.username || ''}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover border-2 border-border group-hover:border-primary/50 transition-colors mx-auto mb-3"
                />
              ) : (
                <DefaultAvatar className="w-16 h-16 border-2 border-border group-hover:border-primary/50 transition-colors mx-auto mb-3" />
              )}
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <span className="font-semibold text-text-primary text-sm truncate">
                  {member.display_name || member.username}
                </span>
                {member.is_verified && <UserCheck size={12} className="text-primary shrink-0" />}
              </div>
              {member.username && (
                <div className="text-text-muted text-xs mb-2">@{member.username}</div>
              )}
              <div className="text-xs text-text-muted">{member.followers_count ?? 0} followers</div>
              {member.location && (
                <div className="text-text-disabled text-xs mt-1 truncate">{member.location}</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
