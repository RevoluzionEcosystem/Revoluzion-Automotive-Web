'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home, Users, ShoppingBag, Wrench, CalendarDays,
  Car, Map, MessageSquare, Bell, User, Search, Store,
  LogIn, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/builds', label: 'Builds', icon: Wrench },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/marketplace', label: 'Marketplace', icon: Store },
  { href: '/clubs', label: 'Clubs', icon: Users },
  { href: '/members', label: 'Members', icon: User },
  { href: '/explore/map', label: 'Map', icon: Map },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

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
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-variant border border-primary/40 shrink-0"
            style={{ boxShadow: '0 0 10px rgba(6,182,212,0.2)' }}
          >
            <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
              <path d="M10 20 L20 8 L30 20 L20 32 Z" stroke="#06B6D4" strokeWidth="2" fill="none" />
              <path d="M15 20 L20 13 L25 20 L20 27 Z" fill="#06B6D4" fillOpacity="0.9" />
            </svg>
          </div>
          {!collapsed && (
            <span className="font-bold text-sm tracking-wider gradient-text uppercase truncate">
              Revoluzion
            </span>
          )}
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group',
                active
                  ? 'bg-primary/15 text-primary border border-primary/25'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-variant'
              )}
            >
              <Icon
                size={18}
                className={cn('shrink-0', active ? 'text-primary' : 'group-hover:text-primary transition-colors')}
              />
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
