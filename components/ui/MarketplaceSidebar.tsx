'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tag, Layers, CheckCircle, LayoutDashboard } from 'lucide-react'
import { StandardSubmenuSidebar, SidebarSection } from '@/components/ui/StandardSubmenuSidebar'

interface Props {
  className?: string
}

const CATEGORIES = ['All', 'Parts', 'Accessories', 'Tools', 'Tyres & Rims', 'Electronics', 'Exhaust', 'Suspension']
const CONDITIONS = ['All', 'New', 'Like New', 'Good', 'Fair']

export function MarketplaceSidebar({ className = '' }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const activeCategory = searchParams.get('category') || 'All'
  const activeCondition = searchParams.get('condition') || 'All'
  const searchVal = searchParams.get('q') || ''

  const getHrefForCategory = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (cat === 'All') {
      params.delete('category')
    } else {
      params.set('category', cat)
    }
    return `/marketplace?${params.toString()}`
  }

  const getHrefForCondition = (cond: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (cond === 'All') {
      params.delete('condition')
    } else {
      params.set('condition', cond)
    }
    return `/marketplace?${params.toString()}`
  }

  const sections: SidebarSection[] = [
    {
      headerText: 'CATEGORIES',
      headerIcon: <Layers className="h-3 w-3 text-primary" />,
      items: CATEGORIES.map((cat) => ({
        key: cat,
        label: cat,
        href: getHrefForCategory(cat),
        isActive: activeCategory === cat,
      })),
    },
    {
      headerText: 'CONDITION',
      headerIcon: <Tag className="h-3 w-3 text-teal-400" />,
      items: CONDITIONS.map((cond) => ({
        key: cond,
        label: cond,
        href: getHrefForCondition(cond),
        isActive: activeCondition === cond,
      })),
    },
  ]

  const footerWidget = (
    <div className="bg-surface/80 border border-border/80 rounded-2xl p-4 space-y-2 hidden lg:block shadow-xl">
      <div className="flex items-center gap-1.5 text-primary text-xs font-bold leading-none" style={{ fontFamily: 'var(--font-orbitron)' }}>
        <CheckCircle className="h-4 w-4 stroke-[2.5]" /> TRANSACT SAFELY
      </div>
      <p className="text-[10px] text-text-muted leading-relaxed">
        Always inspect components in person before completing deals. Confirm compatibility specs by matching thread formats in our library list screen!
      </p>
    </div>
  )

  const headerWidget = (
    <div className="w-full mb-4">
      <button
        onClick={() => router.push('/marketplace/dashboard')}
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
