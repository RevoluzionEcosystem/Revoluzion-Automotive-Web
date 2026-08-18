'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Home, Car, CalendarDays, ShoppingBag, MessageSquare, LayoutGrid, X,
  User, Bike, Store, Package, Wrench, Users, UserPlus, BookOpen, Bell, Mail, Map as LucideMap,
} from 'lucide-react'

const primaryTabs = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/marketplace', label: 'Marketplace', icon: Store },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
]

const menuItems = [
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/vehicle-ads', label: 'Vehicle Ads', icon: Bike },
  { href: '/garage', label: 'Garage', icon: Car },
  { href: '/halfcuts', label: 'Halfcuts', icon: Package },
  { href: '/services', label: 'Services', icon: Wrench },
  { href: '/car-clubs', label: 'Car Clubs', icon: Users },
  { href: '/members', label: 'Members', icon: UserPlus },
  { href: '/guides', label: 'Guides', icon: BookOpen },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/chat/dm/inbox', label: 'Inbox', icon: Mail },
  { href: '/explore/map', label: 'Map', icon: LucideMap },
]

export function BottomNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-md border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 items-end">
          {primaryTabs.slice(0, 2).map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2.5 px-1 transition-colors',
                  active ? 'text-primary' : 'text-text-muted hover:text-text-primary'
                )}
              >
                <Icon size={20} />
                <span className="text-[10px] leading-tight">{label}</span>
              </Link>
            )
          })}

          {/* Center menu button */}
          <div className="flex justify-center">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="w-12 h-12 -translate-y-2 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform shadow-[0_8px_24px_rgba(6,182,212,0.45)]"
              style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 50%, #14B8A6 100%)' }}
            >
              <LayoutGrid size={22} />
            </button>
          </div>

          {primaryTabs.slice(2).map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2.5 px-1 transition-colors',
                  active ? 'text-primary' : 'text-text-muted hover:text-text-primary'
                )}
              >
                <Icon size={20} />
                <span className="text-[10px] leading-tight">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom sheet — flows up with the full menu */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-surface border-t border-border rounded-t-[20px] animate-sheet-up max-h-[80dvh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-border/50">
              <span className="text-xs font-black uppercase tracking-[0.2em] gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>
                Explore Revoluzion
              </span>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-surface-variant transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 px-4 py-4">
              {menuItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex flex-col items-center gap-2 py-3.5 rounded-xl bg-surface-variant/40 border border-border/40 hover:border-primary/40 hover:bg-surface-variant transition-colors"
                >
                  <Icon size={20} className="text-primary" />
                  <span className="text-[11px] text-text-secondary text-center leading-tight">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
