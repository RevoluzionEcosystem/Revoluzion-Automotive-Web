'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { BadgeCheck, BookOpen, Wrench, Shield, FileSpreadsheet, Layers } from 'lucide-react'
import { StandardSubmenuSidebar, SidebarSection } from '@/components/ui/StandardSubmenuSidebar'

interface SimpleGuide {
  slug: string
  title: string
  category: string | null
}

interface Props {
  guides: SimpleGuide[]
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  engine: <Wrench className="h-3.5 w-3.5 text-primary shrink-0" />,
  brakes: <Shield className="h-3.5 w-3.5 text-green-400 shrink-0" />,
  suspension: <FileSpreadsheet className="h-3.5 w-3.5 text-yellow-400 shrink-0" />,
  electrical: <Layers className="h-3.5 w-3.5 text-purple-400 shrink-0" />,
  exterior: <Wrench className="h-3.5 w-3.5 text-blue-400 shrink-0" />,
  interior: <Wrench className="h-3.5 w-3.5 text-pink-400 shrink-0" />,
  general: <BookOpen className="h-3.5 w-3.5 text-teal-400 shrink-0" />,
}

const CATEGORY_NAMES: Record<string, string> = {
  engine: 'Engine & Tuning',
  brakes: 'Brakes & Chassis',
  suspension: 'Suspension',
  electrical: 'ECU & Electronics',
  exterior: 'Exterior',
  interior: 'Interior',
  general: 'General Info',
}

export function ConsolidatedGuidesSidebar({ guides }: Props) {
  const searchParams = useSearchParams()
  const activeGuideSlug = searchParams.get('guide')

  // Group database guides by their category dynamically, filtering out the repetitive main guide link
  const groupedGuides: Record<string, SimpleGuide[]> = {}
  guides.forEach((g) => {
    if (g.slug === 'threads-and-fittings' || g.slug === 'thread-sizes-and-fittings') return
    const cat = g.category || 'general'
    if (!groupedGuides[cat]) {
      groupedGuides[cat] = []
    }
    groupedGuides[cat].push(g)
  })

  // Order of sections to output
  const sectionsList = ['general', 'engine', 'brakes', 'suspension', 'electrical', 'exterior', 'interior']

  const sections: SidebarSection[] = [
    {
      headerText: 'QUICK REFERENCE',
      headerIcon: <BookOpen className="h-3 w-3 text-primary shrink-0" />,
      items: [
        {
          key: 'quick-ref',
          label: 'Sizes & Fittings Guide',
          href: '/guides',
          isActive: !activeGuideSlug,
          icon: <BookOpen className="h-3.5 w-3.5 text-text-muted shrink-0" />,
        },
      ],
    },
    ...sectionsList.map((sec) => {
      const list = groupedGuides[sec] || []
      return {
        headerText: (CATEGORY_NAMES[sec] || sec).toUpperCase(),
        headerIcon: CATEGORY_ICONS[sec],
        items: list.map((g) => {
          const isFittings = g.slug === 'threads-and-fittings'
          const href = isFittings ? '/guides' : `/guides?guide=${g.slug}`
          const isActive = isFittings ? !activeGuideSlug : activeGuideSlug === g.slug

          return {
            key: g.slug,
            label: g.title,
            href: href,
            isActive: isActive,
            icon: CATEGORY_ICONS[sec],
          }
        }),
      }
    }),
  ]

  const footerWidget = (
    <div className="bg-surface/80 border border-border/80 rounded-2xl p-4 space-y-2 hidden lg:block shadow-xl">
      <div className="flex items-center gap-1.5 text-primary text-xs font-bold leading-none" style={{ fontFamily: 'var(--font-orbitron)' }}>
        <BadgeCheck className="h-4 w-4 stroke-[2.5]" /> DIRECTORY STANDARD
      </div>
      <p className="text-[10px] text-text-muted leading-relaxed">
        Workshop and garage calibrated formulas. Read component alignments, fluid dimensions, clearances, and thread compatibility guides directly inside this screen.
      </p>
    </div>
  )

  return (
    <StandardSubmenuSidebar
      sections={sections}
      footerWidget={footerWidget}
    />
  )
}
