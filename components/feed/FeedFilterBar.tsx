'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Rss, FileText, Car, Wrench, CalendarDays, ShoppingBag, Wrench as ServiceIcon, UserPlus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface FilterDef {
  key: string
  label: string
  icon: LucideIcon
}

const FILTERS: FilterDef[] = [
  { key: 'all', label: 'All', icon: Rss },
  { key: 'posts', label: 'Posts', icon: FileText },
  { key: 'garage', label: 'Cars', icon: Car },
  { key: 'builds', label: 'Builds', icon: Wrench },
  { key: 'events', label: 'Events', icon: CalendarDays },
  { key: 'listings', label: 'Deals', icon: ShoppingBag },
  { key: 'services', label: 'Services', icon: ServiceIcon },
  { key: 'users', label: 'Members', icon: UserPlus },
]

/** Horizontal, mobile-first feed filter chips. Desktop keeps the sidebar. */
export function FeedFilterBar({ className = '' }: { className?: string }) {
  const searchParams = useSearchParams()
  const activeType = searchParams.get('type') || 'all'

  const getHref = (type: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (type === 'all') params.delete('type')
    else params.set('type', type)
    const qs = params.toString()
    return `/feed${qs ? `?${qs}` : ''}`
  }

  return (
    <div
      className={cn(
        'lg:hidden sticky top-0 z-30 px-4 sm:px-6 py-2.5 bg-background/85 backdrop-blur-md border-b border-border/60',
        className,
      )}
    >
      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">
        {FILTERS.map(({ key, label, icon: Icon }) => {
          const active = activeType === key
          return (
            <Link
              key={key}
              href={getHref(key)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-1.5 shrink-0 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-colors whitespace-nowrap',
                active
                  ? 'bg-primary/15 border-primary/50 text-primary shadow-[0_0_14px_rgba(6,182,212,0.15)]'
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:border-border-light',
              )}
            >
              <Icon size={13} className={active ? 'text-primary' : 'text-text-muted'} />
              {label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
