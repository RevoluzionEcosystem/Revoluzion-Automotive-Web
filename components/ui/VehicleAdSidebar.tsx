'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Layers, CheckCircle, LayoutDashboard, Bike } from 'lucide-react'
import { StandardSubmenuSidebar, SidebarSection } from '@/components/ui/StandardSubmenuSidebar'

interface Props {
  className?: string
}

const MAKES = ['All', 'BMW', 'Mercedes-Benz', 'Toyota', 'Honda', 'Nissan', 'Porsche', 'Mazda', 'Ducati', 'Yamaha', 'Harley-Davidson', 'Other']

export function VehicleAdSidebar({ className = '' }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const activeMake = searchParams.get('make') || 'All'

  const getHrefForMake = (make: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (make === 'All') {
      params.delete('make')
    } else {
      params.set('make', make)
    }
    return `/vehicles?${params.toString()}`
  }

  const sections: SidebarSection[] = [
    {
      headerText: 'VEHICLE MANUFACTURER',
      headerIcon: <Bike className="h-3.5 w-3.5 text-primary" />,
      items: MAKES.map((make) => ({
        key: make,
        label: make,
        href: getHrefForMake(make),
        isActive: activeMake === make,
      })),
    },
  ]

  const footerWidget = (
    <div className="bg-surface/80 border border-border/80 rounded-2xl p-4 space-y-2 hidden lg:block shadow-xl">
      <div className="flex items-center gap-1.5 text-primary text-xs font-bold leading-none" style={{ fontFamily: 'var(--font-orbitron)' }}>
        <CheckCircle className="h-4 w-4 stroke-[2.5]" /> AUTHENTIC DEALS
      </div>
      <p className="text-[10px] text-text-muted leading-relaxed">
        Verify logbooks, mileage counters, service manuals, and running conditions in person before releasing funds. Save lists to check builds on our portal!
      </p>
    </div>
  )

  const headerWidget = (
    <div className="w-full mb-4">
      <button
        onClick={() => router.push('/garage')}
        className="w-full h-11 bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/60 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200"
        style={{ fontFamily: 'var(--font-orbitron)' }}
      >
        <LayoutDashboard className="h-4 w-4" />
        My Garage Portfolio
      </button>
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
