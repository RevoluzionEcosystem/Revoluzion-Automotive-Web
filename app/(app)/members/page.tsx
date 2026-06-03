'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { Users, Search, UserCheck } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import type { Profile } from '@/lib/supabase/types'

export default function MembersPage() {
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', debouncedSearch],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio, location, is_verified, followers_count, following_count')
        .order('followers_count', { ascending: false })
        .limit(60)

      if (debouncedSearch) {
        query = query.or(`username.ilike.%${debouncedSearch}%,display_name.ilike.%${debouncedSearch}%`)
      }

      const { data } = await query
      return (data ?? []) as Profile[]
    },
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>Members</h1>
        <p className="text-text-muted text-sm mt-1">The Revoluzion community</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="input pl-9 text-sm"
        />
      </div>

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
      ) : members.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <Users size={48} className="mx-auto mb-4 opacity-30" />
          <p>No members found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {members.map((member) => (
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
                <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-border group-hover:border-primary/50 transition-colors flex items-center justify-center text-primary text-xl font-bold mx-auto mb-3">
                  {getInitials(member.display_name || member.username || 'U')}
                </div>
              )}
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <span className="font-semibold text-text-primary text-sm truncate">
                  {member.display_name || member.username}
                </span>
                {member.is_verified && (
                  <UserCheck size={12} className="text-primary shrink-0" />
                )}
              </div>
              {member.username && (
                <div className="text-text-muted text-xs mb-2">@{member.username}</div>
              )}
              <div className="flex items-center justify-center gap-3 text-xs text-text-muted">
                <span>{member.followers_count} followers</span>
              </div>
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
