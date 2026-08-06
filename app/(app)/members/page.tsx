'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { Users, Search, UserCheck, MapPin, SlidersHorizontal, ArrowUpDown, ChevronUp, ChevronDown, Award } from 'lucide-react'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { FallbackAvatar } from '@/components/ui/FallbackAvatar'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/supabase/types'

type SortColumn = 'username' | 'display_name' | 'followers_count' | 'following_count' | 'created_at' | 'location'
type SortOrder = 'asc' | 'desc'

export default function MembersPage() {
  const supabase = createClient()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [founderOnly, setFounderOnly] = useState(false)
  const [locationFilter, setLocationFilter] = useState('')
  
  // Table Sort State
  const [sortColumn, setSortColumn] = useState<SortColumn>('followers_count')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

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
        .limit(300)

      if (debouncedSearch) {
        query = query.or(`username.ilike.%${debouncedSearch}%,display_name.ilike.%${debouncedSearch}%`)
      }

      const { data } = await query
      return (data ?? []) as Profile[]
    },
  })

  const filteredAndSorted = useMemo(() => {
    let list = [...members]

    // Apply client-side filters
    if (verifiedOnly) list = list.filter(m => m.is_verified)
    if (founderOnly) list = list.filter(m => m.role === 'founder')
    if (locationFilter.trim()) {
      const lf = locationFilter.toLowerCase()
      list = list.filter(m => m.location?.toLowerCase().includes(lf))
    }

    // Apply sorting
    list.sort((a, b) => {
      let valA: any = a[sortColumn]
      let valB: any = b[sortColumn]

      // Handle null cases or undefined values cleanly
      if (sortColumn === 'followers_count' || sortColumn === 'following_count') {
        valA = valA ?? 0
        valB = valB ?? 0
      } else {
        valA = (valA ?? '').toString().toLowerCase()
        valB = (valB ?? '').toString().toLowerCase()
      }

      if (sortColumn === 'created_at') {
        valA = new Date(a.created_at || 0).getTime()
        valB = new Date(b.created_at || 0).getTime()
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    // Pin Founders / Specific Users to the absolute top of the listing
    // We prioritize users who have the 'founder' role of "Founder" and specifically the accounts in the image: "revoluzion_technologia" and "zack_revoluzion"
    const isSpecialFounder = (username: string) => {
      const name = (username || '').toLowerCase()
      return name === 'revoluzion_technologia' || name === 'zack_revoluzion'
    }

    list.sort((a, b) => {
      const isASpecial = isSpecialFounder(a.username || '')
      const isBSpecial = isSpecialFounder(b.username || '')

      if (isASpecial && !isBSpecial) return -1
      if (!isASpecial && isBSpecial) return 1
      return 0
    })

    return list
  }, [members, sortColumn, sortOrder, verifiedOnly, founderOnly, locationFilter])

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortOrder('desc') // Start descending as standard default sort
    }
  }

  const renderSortArrow = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown size={12} className="text-text-disabled opacity-40 group-hover:opacity-100 transition-opacity ml-1 shrink-0" />
    }
    return sortOrder === 'asc' ? (
      <ChevronUp size={13} className="text-primary ml-1 shrink-0" />
    ) : (
      <ChevronDown size={13} className="text-primary ml-1 shrink-0" />
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>Revoluzion Members</h1>
          <p className="text-text-muted text-sm mt-1">Discover, follow and connect with Malaysian drivers, modifiers, and track racers</p>
        </div>
        <div className="text-right select-none hidden sm:block shrink-0">
          <p className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-orbitron)' }}>
            {filteredAndSorted.length}
          </p>
          <span className="text-[10px] text-primary font-black uppercase tracking-widest block leading-none mt-1">
            Registered Drivers
          </span>
        </div>
      </div>

      {/* Control Panels: Search and Active Quick Filter Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-slate-900/10 p-4 border border-slate-900 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username or display name..."
            className="input pl-10 text-xs w-full bg-black/40 border-slate-800 focus:border-primary/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Verified Toggle */}
          <button
            onClick={() => setVerifiedOnly(prev => !prev)}
            className={`h-9 px-3.5 rounded-xl border text-[10px] uppercase font-bold tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
              verifiedOnly
                ? 'bg-primary/10 border-primary/60 text-primary font-black'
                : 'bg-transparent border-slate-800 text-text-secondary hover:border-slate-700 hover:text-white'
            }`}
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            <UserCheck size={12} className={verifiedOnly ? 'text-primary' : 'text-text-muted'} /> Unified Badge Only
          </button>

          {/* Founders Toggle */}
          <button
            onClick={() => setFounderOnly(prev => !prev)}
            className={`h-9 px-3.5 rounded-xl border text-[10px] uppercase font-bold tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
              founderOnly
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-black'
                : 'bg-transparent border-slate-800 text-text-secondary hover:border-slate-700 hover:text-white'
            }`}
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            <Award size={12} className={founderOnly ? 'text-amber-400' : 'text-text-muted'} /> Founders Only
          </button>

          {/* Location manual query */}
          <div className="relative h-9">
            <MapPin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              placeholder="Filter location..."
              className="h-full pl-8 pr-3 text-[10px] bg-black/40 border border-slate-800 rounded-xl text-white outline-none focus:border-primary/50 placeholder:text-text-disabled/40 max-w-[130px]"
            />
          </div>

          {(verifiedOnly || founderOnly || locationFilter) && (
            <button
              onClick={() => { setVerifiedOnly(false); setFounderOnly(false); setLocationFilter('') }}
              className="text-[10px] uppercase tracking-widest text-[#E11D48] hover:text-red-400 transition-colors font-bold ml-2"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table Interface Grid (Full Width) */}
      <div className="border border-slate-900 rounded-2xl bg-slate-950/30 overflow-hidden shadow-2xl relative">
        
        {isLoading ? (
          <div className="p-8 space-y-3.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center h-12 w-full animate-pulse border-b border-white/5 pb-2">
                <div className="w-8 h-8 rounded-full bg-surface-variant shrink-0" />
                <div className="h-3.5 bg-surface-variant rounded w-1/4" />
                <div className="h-3 bg-surface-variant rounded w-1/6" />
                <div className="h-3 bg-surface-variant rounded w-1/12 ml-auto" />
              </div>
            ))}
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="py-24 text-center text-text-muted flex flex-col items-center justify-center space-y-2">
            <Users size={40} className="text-primary/20" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#8A90A0]" style={{ fontFamily: 'var(--font-orbitron)' }}>
              No Members Match Search
            </p>
            <p className="text-[11px] max-w-sm leading-relaxed">
              No registered user profiles matched your filters or active query fields. Try adjusting your parameters to explore drivers.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs min-w-[700px]">
              
              {/* Header */}
              <thead>
                <tr className="border-b border-slate-900 bg-slate-900/30 text-[10px] font-black uppercase tracking-widest text-text-muted select-none">
                  <th className="py-4 px-5">Member</th>
                  
                  <th className="py-4 px-4">
                    <button onClick={() => handleSort('username')} className="group flex items-center uppercase text-left font-black tracking-widest">
                      Username {renderSortArrow('username')}
                    </button>
                  </th>

                  <th className="py-4 px-4">
                    <button onClick={() => handleSort('location')} className="group flex items-center uppercase text-left font-black tracking-widest">
                      Location {renderSortArrow('location')}
                    </button>
                  </th>

                  <th className="py-4 px-4 text-center">
                    <button onClick={() => handleSort('followers_count')} className="group flex items-center uppercase justify-center font-black tracking-widest mx-auto">
                      Followers {renderSortArrow('followers_count')}
                    </button>
                  </th>

                  <th className="py-4 px-4 text-center">
                    <button onClick={() => handleSort('following_count')} className="group flex items-center uppercase justify-center font-black tracking-widest mx-auto">
                      Following {renderSortArrow('following_count')}
                    </button>
                  </th>

                  <th className="py-4 px-5 text-right">
                    <button onClick={() => handleSort('created_at')} className="group flex items-center uppercase justify-end font-black tracking-widest ml-auto">
                      Joined {renderSortArrow('created_at')}
                    </button>
                  </th>
                </tr>
              </thead>

              {/* Rows */}
              <tbody className="divide-y divide-slate-900/60 bg-transparent">
                {filteredAndSorted.map((member) => (
                  <tr 
                    key={member.id}
                    onClick={() => router.push(`/u/${member.username}`)}
                    className="hover:bg-slate-900/30 transition-all duration-200 cursor-pointer group"
                  >
                    {/* Member Profile block */}
                    <td className="py-3 px-5 flex items-center gap-3">
                      <div className="relative w-8 h-8 rounded-full border border-slate-800 shrink-0 flex items-center justify-center bg-surface overflow-hidden">
                        {member.avatar_url ? (
                          <FallbackAvatar 
                            src={member.avatar_url} 
                            alt={member.display_name || member.username || ''} 
                            className="w-full h-full object-cover"
                            fallbackClassName="w-7 h-7"
                          />
                        ) : (
                          <DefaultAvatar className="w-7 h-7" />
                        )}
                      </div>
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-extrabold text-[#E2E8F0] tracking-wide text-xs truncate group-hover:text-primary transition-colors">
                            {member.display_name || member.username}
                          </span>
                          {member.is_verified && (
                            <UserCheck size={12} className="text-primary shrink-0" />
                          )}
                          {(member.role === 'founder' || member.username === 'revoluzion_technologia' || member.username === 'zack_revoluzion') && (
                            <span 
                              className="text-[8px] font-black uppercase text-[#F1C40F] bg-[#F1C40F]/13 px-1.5 py-0.5 rounded tracking-widest shrink-0 ml-1 border border-[#F1C40F]/20 animate-pulse"
                              style={{ fontFamily: 'var(--font-orbitron)' }}
                            >
                              Founder
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-text-disabled truncate block mt-0.5 leading-none">
                          {member.bio ? member.bio : 'No profile bio specified.'}
                        </span>
                      </div>
                    </td>

                    {/* @username */}
                    <td className="py-3 px-4 text-text-secondary font-semibold font-mono text-[11px]">
                      @{member.username}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 text-text-muted">
                      {member.location ? (
                        <span className="flex items-center gap-1 font-medium text-xs text-text-muted">
                          <MapPin size={11} className="text-primary shrink-0" /> {member.location}
                        </span>
                      ) : (
                        <span className="text-text-disabled/40 italic">TBD</span>
                      )}
                    </td>

                    {/* Followers count */}
                    <td className="py-3 px-4 text-center font-bold font-mono text-white text-xs">
                      {member.followers_count ?? 0}
                    </td>

                    {/* Following count */}
                    <td className="py-3 px-4 text-center font-bold font-mono text-text-secondary text-xs">
                      {member.following_count ?? 0}
                    </td>

                    {/* Created at Date */}
                    <td className="py-3 px-5 text-right font-medium text-text-disabled text-xs">
                      {member.created_at ? new Date(member.created_at).toLocaleDateString('en-MY', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : 'TBD'}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </div>

    </div>
  )
}
