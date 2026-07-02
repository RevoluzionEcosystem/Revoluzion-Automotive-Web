'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Car, Wrench, FolderHeart, ShieldCheck } from 'lucide-react'
import { StandardSubmenuSidebar, SidebarSection } from '@/components/ui/StandardSubmenuSidebar'

interface Props {
  className?: string
}

export function GarageSidebar({ className = '' }: Props) {
  const pathname = usePathname()

  const sections: SidebarSection[] = [
    {
      headerText: 'GARAGE NAVIGATION',
      headerIcon: <Car className="h-3 w-3 text-primary shrink-0" />,
      items: [
        {
          key: 'explore-garages',
          label: 'Explore Garages',
          href: '/garage',
          isActive: pathname === '/garage',
          icon: <Car className="h-3.5 w-3.5 text-text-muted shrink-0" />
        },
        {
          key: 'community-builds',
          label: 'Community Builds',
          href: '/garage/builds',
          isActive: pathname === '/garage/builds' || pathname.startsWith('/garage/builds/'),
          icon: <Wrench className="h-3.5 w-3.5 text-text-muted shrink-0" />
        },
        {
          key: 'my-collection',
          label: 'My Collection',
          href: '/garage/me',
          isActive: pathname === '/garage/me',
          icon: <FolderHeart className="h-3.5 w-3.5 text-text-muted shrink-0" />
        }
      ]
    }
  ]

  const footerWidget = (
    <div className="bg-surface/80 border border-border/80 rounded-2xl p-4 space-y-2.5 hidden lg:block shadow-xl">
      <div className="flex items-center gap-1.5 text-primary text-xs font-bold leading-none" style={{ fontFamily: 'var(--font-orbitron)' }}>
        <ShieldCheck className="h-4 w-4 stroke-[2.5]" /> VERIFIED GARAGES
      </div>
      <p className="text-[10px] text-text-muted leading-relaxed">
        Our verified registers host complete catalogs detailing performance specifications, dyno records, engine blocks, and project timeline modifications.
      </p>
    </div>
  )

  const headerWidget = (
    <div className="space-y-1.5 pb-2 border-b border-border/20 mb-4">
      <span className="text-[10px] font-black uppercase text-primary tracking-widest" style={{ fontFamily: 'var(--font-orbitron)' }}>
        REVOLUZION GARAGE
      </span>
      <h2 className="text-sm font-bold text-white tracking-wide uppercase" style={{ fontFamily: 'var(--font-orbitron)' }}>
        GARAGE HUB
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
