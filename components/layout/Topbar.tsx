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
        .from('profiles')
        .select('avatar_url')
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
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/clubs', label: 'Clubs' },
    { href: '/members', label: 'Members' },
    { href: '/explore/map', label: 'Map' },
    { href: '/chat', label: 'Chat' },
  ]

  return (
    <>
      <header className="sticky top-0 z-40 bg-background h-16 border-b border-border">
        <div className="h-full flex items-center gap-2 px-4">
        {/* Left: mobile menu + logo */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-variant transition-colors"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link href="/" className="lg:hidden flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden">
              <Image src="/logo.png" alt="Revoluzion" width={32} height={32} className="w-8 h-8 object-contain" priority />
            </div>
            <span className="font-bold text-xs tracking-widest gradient-text uppercase" style={{ fontFamily: 'var(--font-orbitron)' }}>
              Revoluzion
            </span>
          </Link>
        </div>

        {/* Left actions: notifications + avatar */}
        {user ? (
          <div className="flex items-center gap-1 shrink-0">
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
            <Link href="/profile">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt="Profile"
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover border border-primary/40 hover:border-primary transition-colors"
                />
              ) : (
                <DefaultAvatar className="w-9 h-9 hover:border-primary transition-colors" />
              )}
            </Link>
          </div>
        ) : null}

        {/* Center: search */}
        <div className="flex-1 min-w-0 px-12">
          <div className="hidden md:block w-full">
            <GlobalSearch />
          </div>
        </div>

        {/* Right: cart + mobile search + sign in */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => router.push('/search')}
            className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-variant transition-colors"
          >
            <Search size={20} />
          </button>

          {user ? (
            <CartMiniCard />
          ) : (
            <Link href="/login" className="btn-primary text-sm py-1.5 px-3">
              Sign In
            </Link>
          )}
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
