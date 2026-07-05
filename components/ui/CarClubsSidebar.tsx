'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Compass, BookmarkCheck, Users, ChevronRight, LayoutDashboard, PlusCircle } from 'lucide-react'
import { StandardSubmenuSidebar, SidebarSection, SidebarSectionItem } from '@/components/ui/StandardSubmenuSidebar'

interface CarClubsSidebarProps {
  className?: string
  activeLocation?: string
  onCreateClubClick?: () => void
  onMyDashboardClick?: () => void
  customSections?: SidebarSection[]
  customFooter?: React.ReactNode
}

const DEFAULTS_LOCATIONS = ['All', 'Selangor', 'Kuala Lumpur', 'Penang', 'Johor', 'Nationwide']

/**
 * Super flexible global sidebar for the Car Clubs page and related views.
 * Extends the global StandardSubmenuSidebar template pattern.
 */
export function CarClubsSidebar({
  className = '',
  activeLocation = 'All',
  onCreateClubClick,
  onMyDashboardClick,
  customSections,
  customFooter
}: CarClubsSidebarProps) {
  const router = useRouter()

  const getHrefForLocation = (locationName: string) => {
    if (locationName === 'All') return '/car-clubs'
    return `/car-clubs?location=${encodeURIComponent(locationName)}`
  }

  // Define default section layout if no customSections are passed:
  const defaultSections: SidebarSection[] = [
    {
      headerText: 'LOCATIONS & HUBS',
      headerIcon: <Compass className="h-3 w-3 text-primary shrink-0" />,
      items: DEFAULTS_LOCATIONS.map((loc) => ({
        key: loc,
        label: loc,
        href: getHrefForLocation(loc),
        isActive: activeLocation === loc,
        icon: <Compass className="h-3.5 w-3.5 text-text-muted shrink-0" />
      }))
    }
  ]

  const sections = customSections || defaultSections

  const footerWidget = customFooter || (
    <div className="bg-surface/80 border border-border/80 rounded-2xl p-4 space-y-2 hidden lg:block shadow-xl">
      <div className="flex items-center gap-1.5 text-primary text-xs font-bold leading-none" style={{ fontFamily: 'var(--font-orbitron)' }}>
        <BookmarkCheck className="h-4 w-4 stroke-[2.5]" /> VERIFIED GROUPS
      </div>
      <p className="text-[10px] text-text-muted leading-relaxed">
        Official Revoluzion Communities connect local car owners, VTEC runner crews, classic car restoration clubs, and drifting alliances across Malaysia.
      </p>
    </div>
  )

  const headerWidget = (
    <div className="space-y-4 mb-4 select-none">
      {/* Sidebar header */}
      <div className="space-y-1.5 pb-2 border-b border-border/20">
        <span className="text-[10px] font-black uppercase text-primary tracking-widest" style={{ fontFamily: 'var(--font-orbitron)' }}>
          REVOLUZION COMMUNITIES
        </span>
        <h2 className="text-sm font-bold text-white tracking-wide uppercase" style={{ fontFamily: 'var(--font-orbitron)' }}>
          CAR CLUBS PORTAL
        </h2>
      </div>

      <div className="flex flex-col gap-2">
        {onMyDashboardClick && (
          <button
            onClick={onMyDashboardClick}
            className="w-full h-11 bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/60 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            <LayoutDashboard className="h-4 w-4" />
            My Dashboard
          </button>
        )}

        {onCreateClubClick && (
          <button
            onClick={onCreateClubClick}
            className="w-full h-11 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            <PlusCircle className="h-4 w-4 text-primary" />
            Establish Club
          </button>
        )}
      </div>
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
