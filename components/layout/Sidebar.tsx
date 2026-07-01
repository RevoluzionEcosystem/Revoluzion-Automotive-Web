'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home, Users, ShoppingBag, CalendarDays,
  Car, Map, MessageSquare, Bell, User, Store, BookOpen,
  LogIn, ChevronLeft, ChevronRight, LogOut
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/garage', label: 'Garage', icon: Car },
  { href: '/marketplace', label: 'Marketplace', icon: Store },
  { href: '/clubs', label: 'Clubs', icon: Users },
  { href: '/members', label: 'Members', icon: User },
  // { href: '/explore/map', label: 'Map', icon: Map },
  { href: '/guides', label: 'Guides', icon: BookOpen },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-full bg-surface border-r border-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border shrink-0">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden shrink-0"
            style={{ boxShadow: '0 0 10px rgba(6,182,212,0.2)' }}
          >
            <Image src="/logo.png" alt="Revoluzion" width={32} height={32} className="w-8 h-8 object-contain" priority />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-xs tracking-widest gradient-text uppercase truncate" style={{ fontFamily: 'var(--font-orbitron)' }}>
                Revoluzion
              </span>
              <span className="text-[10px] text-muted-foreground tracking-widest uppercase">Automotive</span>
            </div>
          )}
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {/* Glow-highlighted "Shop Revoluzion Automotive Products" Option at Very Top */}
        <div className="px-1 pb-3">
          <Link
            href="/shop"
            className={cn(
              'flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 relative group overflow-hidden border',
              pathname === '/shop' || pathname.startsWith('/shop/')
                ? 'bg-primary/25 border-primary text-primary shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-primary/5 hover:bg-primary/10 border-primary/20 text-[#06B6D4] hover:text-[#22D3EE] shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]'
            )}
          >
            <ShoppingBag size={18} className="shrink-0 animate-pulse text-primary group-hover:scale-110 transition-transform" />
            {!collapsed && (
              <span 
                className="text-xs font-bold leading-normal" 
                style={{ fontFamily: 'var(--font-orbitron)', letterSpacing: '0.05em' }}
              >
                Shop Revoluzion Products
              </span>
            )}
          </Link>
          <div className="w-full border-b border-border/40 mt-3" />
        </div>

        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group',
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/25'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-variant'
              )}
            >
              <Icon size={18} className={cn('shrink-0', isActive ? 'text-primary' : 'group-hover:text-primary transition-colors')} />
              {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-2 space-y-0.5">
        <Link
          href="/notifications"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-variant transition-colors"
        >
          <Bell size={18} className="shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Notifications</span>}
        </Link>
        <Link
          href="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-variant transition-colors"
        >
          <User size={18} className="shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Profile</span>}
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-error hover:text-error hover:bg-error/10 transition-colors"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-variant transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
