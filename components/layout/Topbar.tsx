'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Bell, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { CartMiniCard } from '@/components/shop/CartMiniCard'
import { GlobalSearch } from '@/components/layout/GlobalSearch'

export function Topbar() {
  const router = useRouter()
  const supabase = createClient()
  const [searchOpen, setSearchOpen] = useState(false)

  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
    staleTime: 5 * 60 * 1000,
  })

      const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data } = await supabase
        .from('users')
        .select('avatar_url, display_name, username')
        .eq('id', user.id)
        .single()
      return data
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      if (!user) return 0
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      return count ?? 0
    },
    enabled: !!user,
  })

  return (
    <>
      <header className="sticky top-0 z-40 bg-background h-16 border-b border-border">
        <div className="h-full grid grid-cols-[auto_1fr_auto] gap-2 sm:gap-6 items-center px-3 sm:px-4">
          {/* Left: back button + notifications + profile (avatar, name, email) + mobile menu */}
          <div className="flex items-center gap-3">
            {/* Global navigation Back trigger button */}
            <button
              onClick={() => router.back()}
              title="Go Back"
              className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-900 bg-slate-950/20 text-text-secondary hover:text-white hover:border-slate-800 transition-all duration-200 shrink-0 cursor-pointer"
            >
              <ArrowLeft size={16} className="stroke-[2.5]" />
            </button>

            {user ? (
              <Link href="/profile" className="flex items-center gap-3">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.display_name || 'Profile'}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover border border-border"
                  />
                ) : (
                  <DefaultAvatar className="w-10 h-10" />
                )}
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="font-semibold text-sm text-text-primary">{profile?.display_name ?? profile?.username ?? user.email}</span>
                  <span className="text-xs text-text-muted">{user?.email ?? ''}</span>
                </div>
              </Link>
            ) : (
              <Link href="/login" className="btn-primary text-sm py-1.5 px-3">
                Sign In
              </Link>
            )}

            <Link
              href="/notifications"
              className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-variant transition-colors"
            >
              <Bell size={23} />
              {unreadCount ? (
                <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </Link>
          </div>

          {/* Center: search (full width inside center column) */}
          <div className="flex justify-center">
            <div className="w-full hidden md:block">
              <GlobalSearch />
            </div>
          </div>

          {/* Right: cart + mobile search */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-variant transition-colors"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            <CartMiniCard />
          </div>
        </div>
      </header>

      {/* Mobile search — same GlobalSearch experience as desktop */}
      {searchOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background">
          <div className="sticky top-0 flex items-center gap-2 px-3 py-2.5 border-b border-border bg-background">
            <button
              onClick={() => setSearchOpen(false)}
              className="p-2 -ml-1 rounded-lg text-text-secondary hover:text-white hover:bg-surface-variant transition-colors"
              aria-label="Close search"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <GlobalSearch autoFocus />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
