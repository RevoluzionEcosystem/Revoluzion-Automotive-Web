'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Rss, FileText, Car, Wrench, Calendar, ShoppingBag, Radio } from 'lucide-react'
import { StandardSubmenuSidebar, SidebarSection } from '@/components/ui/StandardSubmenuSidebar'

interface Props {
  className?: string
}

export function FeedSidebar({ className = '' }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const activeType = searchParams.get('type') || 'all'

  const getHrefForType = (type: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (type === 'all') {
      params.delete('type')
    } else {
      params.set('type', type)
    }
    return `/feed?${params.toString()}`
  }

  const sections: SidebarSection[] = [
    {
      headerText: 'FEED TIMELINE',
      headerIcon: <Radio className="h-3 w-3 text-primary shrink-0 animate-pulse" />,
      items: [
        {
          key: 'all',
          label: 'All Activities',
          href: getHrefForType('all'),
          isActive: activeType === 'all',
          icon: <Rss className="h-3.5 w-3.5 text-text-muted shrink-0" />
        },
        {
          key: 'posts',
          label: 'Chitchat Posts',
          href: getHrefForType('posts'),
          isActive: activeType === 'posts',
          icon: <FileText className="h-3.5 w-3.5 text-text-muted shrink-0" />
        },
        {
          key: 'garage',
          label: 'Added Cars',
          href: getHrefForType('garage'),
          isActive: activeType === 'garage',
          icon: <Car className="h-3.5 w-3.5 text-text-muted shrink-0" />
        },
        {
          key: 'builds',
          label: 'Custom Builds',
          href: getHrefForType('builds'),
          isActive: activeType === 'builds',
          icon: <Wrench className="h-3.5 w-3.5 text-text-muted shrink-0" />
        },
        {
          key: 'events',
          label: 'Automotive Meets',
          href: getHrefForType('events'),
          isActive: activeType === 'events',
          icon: <Calendar className="h-3.5 w-3.5 text-text-muted shrink-0" />
        },
        {
          key: 'listings',
          label: 'Classified Deals',
          href: getHrefForType('listings'),
          isActive: activeType === 'listings',
          icon: <ShoppingBag className="h-3.5 w-3.5 text-text-muted shrink-0" />
        }
      ]
    }
  ]

  const footerWidget = (
    <div className="bg-surface/80 border border-border/80 rounded-2xl p-4 space-y-2.5 hidden lg:block shadow-xl">
      <div className="flex items-center gap-1.5 text-primary text-xs font-bold leading-none" style={{ fontFamily: 'var(--font-orbitron)' }}>
        <Radio className="h-4 w-4 stroke-[2.5] text-primary" /> LIVE TELEMETRY
      </div>
      <p className="text-[10px] text-text-muted leading-relaxed">
        The Revoluzion Timeline broadcasts public community occurrences seamlessly. Keep track of workshop events, dyno specs, and classic restoration logs.
      </p>
    </div>
  )

  const headerWidget = (
    <div className="space-y-1.5 pb-2 border-b border-border/20 mb-4 select-none">
      <span className="text-[10px] font-black uppercase text-primary tracking-widest block" style={{ fontFamily: 'var(--font-orbitron)' }}>
        REVOLUZION NETWORKS
      </span>
      <h2 className="text-sm font-bold text-white tracking-wide uppercase" style={{ fontFamily: 'var(--font-orbitron)' }}>
        ACTIVITY STREAM
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
