'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, Bell, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { CartMiniCard } from '@/components/shop/CartMiniCard'
import { GlobalSearch } from '@/components/layout/GlobalSearch'

export function Topbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const mobileNavItems = [
    { href: '/feed', label: 'Feed' },
    { href: '/community', label: 'Community' },
    { href: '/builds', label: 'Builds' },
    { href: '/events', label: 'Events' },
    { href: '/shop', label: 'Shop' },
    { href: '/guides', label: 'Guides' },
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/clubs', label: 'Clubs' },
    { href: '/members', label: 'Members' },
    { href: '/explore/map', label: 'Map' },
    { href: '/chat', label: 'Chat' },
  ]

  return (
    <>
      <header className="sticky top-0 z-40 bg-background h-16 border-b border-border">
        <div className="h-full grid grid-cols-[auto_1fr_auto] gap-6 items-center px-4">
          {/* Left: notifications + profile (avatar, name, email) + mobile menu */}
          <div className="flex items-center gap-3">

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
                <div className="flex flex-col leading-tight">
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

            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-variant transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
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
              onClick={() => router.push('/search')}
              className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-variant transition-colors"
            >
              <Search size={20} />
            </button>

            <CartMiniCard />
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 pt-16">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <nav className="relative bg-surface border-r border-border w-64 h-full overflow-y-auto py-4 px-2">
            {mobileNavItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-variant transition-colors text-sm font-medium"
              >
                {label}
              </Link>
            ))}
            {user && (
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2.5 rounded-lg text-error hover:bg-surface-variant transition-colors text-sm font-medium mt-4"
              >
                Sign Out
              </button>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
