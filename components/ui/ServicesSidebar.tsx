'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Settings, Layers, CheckCircle, LayoutDashboard, Map } from 'lucide-react'
import { StandardSubmenuSidebar, SidebarSection } from '@/components/ui/StandardSubmenuSidebar'

interface Props {
  className?: string
}

const CATEGORIES = [
  { label: 'All Services', value: 'All' },
  { label: 'Workshops', value: 'workshop' },
  { label: 'Car Wash', value: 'car_wash' },
  { label: 'Car Paints', value: 'car_paint' },
  { label: 'Freelance & Mobile', value: 'freelance_work' }
]

export function ServicesSidebar({ className = '' }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const activeCategory = searchParams.get('category') || 'All'

  const getHrefForCategory = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (cat === 'All') {
      params.delete('category')
    } else {
      params.set('category', cat)
    }
    return `/services?${params.toString()}`
  }

  const sections: SidebarSection[] = [
    {
      headerText: 'CATEGORIES',
      headerIcon: <Layers className="h-3 w-3 text-primary" />,
      items: CATEGORIES.map((cat) => ({
        key: cat.value,
        label: cat.label,
        href: getHrefForCategory(cat.value),
        isActive: activeCategory === cat.value,
      })),
    },
  ]

  const footerWidget = (
    <div className="bg-surface/80 border border-border/80 rounded-2xl p-4 space-y-2 hidden lg:block shadow-xl">
      <div className="flex items-center gap-1.5 text-primary text-xs font-bold leading-none" style={{ fontFamily: 'var(--font-orbitron)' }}>
        <CheckCircle className="h-4 w-4 stroke-[2.5]" /> ACCURATE LOCATIONS
      </div>
      <p className="text-[10px] text-text-muted leading-relaxed">
        Locate physical workshops, mobile mechanics and spray painters near you using our live geospatial navigation map search.
      </p>
    </div>
  )

  const headerWidget = (
    <div className="w-full mb-4 space-y-2">
      <button
        onClick={() => router.push('/services/dashboard')}
        className="w-full h-11 bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/60 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200"
        style={{ fontFamily: 'var(--font-orbitron)' }}
      >
        <LayoutDashboard className="h-4 w-4" />
        My Ads Dashboard
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
