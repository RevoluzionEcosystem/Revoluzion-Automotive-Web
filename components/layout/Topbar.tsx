'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Search, Bell, ShoppingCart, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

export function Topbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
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
      <header className="sticky top-0 z-40 bg-background h-16 flex items-center px-4">
        {/* Left: mobile menu + logo */}
        <div className="flex items-center gap-2">
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

        {/* Center: search */}
        <div className="flex-1 flex justify-center">
          <div className="hidden md:block w-full max-w-xl">
            <div className="relative w-full">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search builds, events, members..."
                className="input pl-10 py-2.5 text-sm bg-surface"
                onFocus={() => router.push('/search')}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          {/* Search (mobile) */}
          <button
            onClick={() => router.push('/search')}
            className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-variant transition-colors"
          >
            <Search size={20} />
          </button>

          {user ? (
            <>
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
              <Link
                href="/shop/cart"
                className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-variant transition-colors"
              >
                <ShoppingCart size={23} />
              </Link>
              <Link href="/profile">
                <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-sm font-bold hover:border-primary transition-colors">
                  U
                </div>
              </Link>
            </>
          ) : (
            <Link href="/login" className="btn-primary text-sm py-1.5 px-3">
              Sign In
            </Link>
          )}
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
