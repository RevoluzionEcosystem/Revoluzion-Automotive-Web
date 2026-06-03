'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Users, Car, CalendarDays, ShoppingBag, MessageSquare, Map, User } from 'lucide-react'

const items = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/builds', label: 'Garage', icon: Car },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/explore/map', label: 'Map', icon: Map },
  { href: '/profile', label: 'Profile', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-black border-t border-border">
      <div className="flex overflow-x-auto scrollbar-none">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 min-w-[64px] flex flex-col items-center gap-0.5 py-2 px-1 transition-colors',
                active ? 'text-primary' : 'text-text-muted'
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] leading-tight truncate">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
