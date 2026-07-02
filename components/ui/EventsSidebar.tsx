'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarRange, MapPin, BadgePercent } from 'lucide-react'
import { StandardSubmenuSidebar, SidebarSection } from '@/components/ui/StandardSubmenuSidebar'

interface Props {
  className?: string
}

const EVENT_CATEGORIES = ['All', 'Car Meet', 'Track Day', 'Show & Shine', 'Rally', 'Charity', 'Club Run', 'Workshop', 'Cruise', 'Other']
const STATE_FILTERS = ['All States', 'Selangor', 'Kuala Lumpur', 'Penang', 'Johor', 'Melaka', 'Perak', 'Sabah', 'Sarawak', 'Pahang']

export function EventsSidebar({ className = '' }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const activeCategory = searchParams.get('category') || 'All'
  const activeState = searchParams.get('state') || 'All States'

  const getHrefForCategory = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (cat === 'All') {
      params.delete('category')
    } else {
      params.set('category', cat)
    }
    return `/events?${params.toString()}`
  }

  const getHrefForState = (st: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (st === 'All States') {
      params.delete('state')
    } else {
      params.set('state', st)
    }
    return `/events?${params.toString()}`
  }

  const sections: SidebarSection[] = [
    {
      headerText: 'EVENT SPEC',
      headerIcon: <CalendarRange className="h-3 w-3 text-primary shrink-0" />,
      items: EVENT_CATEGORIES.map((cat) => ({
        key: cat,
        label: cat,
        href: getHrefForCategory(cat),
        isActive: activeCategory === cat,
      }))
    },
    {
      headerText: 'BY REGION',
      headerIcon: <MapPin className="h-3 w-3 text-teal-400 shrink-0" />,
      items: STATE_FILTERS.map((st) => ({
        key: st,
        label: st,
        href: getHrefForState(st),
        isActive: activeState === st,
      }))
    }
  ]

  const footerWidget = (
    <div className="bg-surface/80 border border-border/80 rounded-2xl p-4 space-y-2 hidden lg:block shadow-xl">
      <div className="flex items-center gap-1.5 text-primary text-xs font-bold leading-none" style={{ fontFamily: 'var(--font-orbitron)' }}>
        <BadgePercent className="h-4 w-4 stroke-[2.5]" /> DISCOVER CAR MEETS
      </div>
      <p className="text-[10px] text-text-muted leading-relaxed">
        Join track day events at Sepang, meet JDM owners, classic restorations, and find like-minded petrolheads in your region.
      </p>
    </div>
  )

  const headerWidget = (
    <div className="space-y-1.5 pb-2 border-b border-border/20 mb-4">
      <span className="text-[10px] font-black uppercase text-primary tracking-widest block" style={{ fontFamily: 'var(--font-orbitron)' }}>
        REVOLUZION MEETS
      </span>
      <h2 className="text-sm font-bold text-white tracking-wide uppercase" style={{ fontFamily: 'var(--font-orbitron)' }}>
        EVENTS PORTAL
      </h2>
    </div>
  )

  return (
    <StandardSubmenuSidebar
      sections={sections}
      className={className}
      headerWidget={headerWidget}
      footerWidget={footerWidget}
    />
  )
}
