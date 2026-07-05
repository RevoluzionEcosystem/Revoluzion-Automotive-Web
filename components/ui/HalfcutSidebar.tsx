'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Layers, HelpCircle, CheckCircle, LayoutDashboard } from 'lucide-react'
import { StandardSubmenuSidebar, SidebarSection } from '@/components/ui/StandardSubmenuSidebar'

interface Props {
  className?: string
}

const REGIONS = ['All', 'Kuala Lumpur', 'Selangor', 'Penang', 'Johor', 'Perak', 'Melaka', 'Sabah', 'Sarawak']

export function HalfcutSidebar({ className = '' }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const activeRegion = searchParams.get('region') || 'All'

  const getHrefForRegion = (region: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (region === 'All') {
      params.delete('region')
    } else {
      params.set('region', region)
    }
    return `/halfcuts?${params.toString()}`
  }

  const sections: SidebarSection[] = [
    {
      headerText: 'LOCATION / STATE',
      headerIcon: <Layers className="h-3 w-3 text-primary" />,
      items: REGIONS.map((region) => ({
        key: region,
        label: region,
        href: getHrefForRegion(region),
        isActive: activeRegion === region,
      })),
    },
  ]

  const footerWidget = (
    <div className="bg-surface/80 border border-border/80 rounded-2xl p-4 space-y-2 hidden lg:block shadow-xl">
      <div className="flex items-center gap-1.5 text-primary text-xs font-bold leading-none" style={{ fontFamily: 'var(--font-orbitron)' }}>
        <CheckCircle className="h-4 w-4 stroke-[2.5]" /> HALF-CUT STRIPPING
      </div>
      <p className="text-[10px] text-text-muted leading-relaxed">
        Browse donor vehicles, scrap bundles, custom spare packages, and cut chassis frames. Always inspect thread pitch and harness pins beforehand!
      </p>
    </div>
  )

  const headerWidget = (
    <div className="w-full mb-4">
      <button
        onClick={() => router.push('/halfcuts/dashboard')}
        className="w-full h-11 bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/60 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200"
        style={{ fontFamily: 'var(--font-orbitron)' }}
      >
        <LayoutDashboard className="h-4 w-4" />
        My Dashboard
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