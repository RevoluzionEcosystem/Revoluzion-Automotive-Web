'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, Layers, ShieldAlert, Wrench } from 'lucide-react'
import { StandardSubmenuSidebar, SidebarSection } from '@/components/ui/StandardSubmenuSidebar'

interface Props {
  className?: string
}

export function PartsSidebar({ className = '' }: Props) {
  const pathname = usePathname()

  const sections: SidebarSection[] = [
    {
      headerText: 'PARTS DATA BASE',
      headerIcon: <Layers className="h-3 w-3 text-primary shrink-0" />,
      items: [
        {
          key: 'parts-explorer',
          label: 'Spareparts Catalog',
          href: '/parts',
          isActive: pathname === '/parts',
          icon: <Map className="h-3.5 w-3.5 text-text-muted shrink-0" />
        }
      ]
    }
  ]

  const footerWidget = (
    <div className="bg-surface/80 border border-border/80 rounded-2xl p-4 space-y-2.5 hidden lg:block shadow-xl">
      <div className="flex items-center gap-1.5 text-primary text-xs font-bold leading-none" style={{ fontFamily: 'var(--font-orbitron)' }}>
        <ShieldAlert className="h-4 w-4 stroke-[2.5]" /> LIVE PARTS DIRECTORY
      </div>
      <p className="text-[10px] text-text-muted leading-relaxed">
        This database processes schematic layouts & reference indices compiled from service logs of performance aggregates.
      </p>
    </div>
  )

  const headerWidget = (
    <div className="space-y-1.5 pb-2 border-b border-border/20 mb-4">
      <span className="text-[10px] font-black uppercase text-primary tracking-widest" style={{ fontFamily: 'var(--font-orbitron)' }}>
        BIMMER DIAGNOSTICS
      </span>
      <h2 className="text-sm font-bold text-white tracking-wide uppercase" style={{ fontFamily: 'var(--font-orbitron)' }}>
        PARTS DESK
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
