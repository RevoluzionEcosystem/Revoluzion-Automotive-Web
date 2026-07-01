'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChevronRight, BadgeCheck, BookOpen, Wrench, Shield, FileSpreadsheet, Layers } from 'lucide-react'

interface SimpleGuide {
  slug: string
  title: string
  category: string | null
}

interface Props {
  guides: SimpleGuide[]
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  engine: <Wrench className="h-3.5 w-3.5" />,
  brakes: <Shield className="h-3.5 w-3.5" />,
  suspension: <FileSpreadsheet className="h-3.5 w-3.5" />,
  electrical: <Layers className="h-3.5 w-3.5" />,
  exterior: <Wrench className="h-3.5 w-3.5" />,
  interior: <Wrench className="h-3.5 w-3.5" />,
  general: <BookOpen className="h-3.5 w-3.5" />,
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

  // Group database guides by their category dynamically
  const groupedGuides: Record<string, SimpleGuide[]> = {}
  guides.forEach((g) => {
    const cat = g.category || 'general'
    if (!groupedGuides[cat]) {
      groupedGuides[cat] = []
    }
    groupedGuides[cat].push(g)
  })

  // Order of sections to output
  const sections = ['general', 'engine', 'brakes', 'suspension', 'electrical', 'exterior', 'interior']

  return (
    <aside className="w-full lg:w-80 lg:shrink-0 lg:border-r lg:border-border/60 bg-surface/30 lg:pr-6 h-fit lg:h-[calc(100vh-5rem)] lg:sticky lg:top-14 overflow-y-auto pb-16 space-y-6">
      
      {/* Sidebar header */}
      <div className="space-y-1.5 pb-4 border-b border-border/40">
        <span className="text-[10px] font-black uppercase text-primary tracking-widest" style={{ fontFamily: 'var(--font-orbitron)' }}>
          AUTOMOTIVE LIBRARY
        </span>
        <h2 className="text-sm font-bold text-white tracking-wide uppercase" style={{ fontFamily: 'var(--font-orbitron)' }}>
          DIY MECHANICAL GUIDES
        </h2>
      </div>

      {/* Main landing reference selector */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase text-text-muted tracking-wide block" style={{ fontFamily: 'var(--font-orbitron)' }}>
          Quick Reference Sheet
        </span>
        <Link
          href="/guides"
          className={`group flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
            !activeGuideSlug
              ? 'bg-primary/5 border-primary/40 text-primary font-bold shadow-lg shadow-primary/5'
              : 'bg-transparent border-transparent text-text-secondary hover:border-border/80 hover:bg-surface-variant/30 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                !activeGuideSlug
                  ? 'bg-primary/25 text-primary border border-primary/30'
                  : 'bg-[#1C1F26] text-text-muted group-hover:text-text-secondary group-hover:bg-[#252934]'
              }`}
            >
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h4
                className={`text-xs font-semibold leading-none transition-colors ${
                  !activeGuideSlug ? 'text-white font-extrabold' : 'text-text-secondary group-hover:text-white'
                }`}
                style={{ fontFamily: 'var(--font-inter), sans-serif' }}
              >
                Sizes & Fittings Guide
              </h4>
            </div>
          </div>

          <ChevronRight
            className={`h-3.5 w-3.5 shrink-0 transition-transform ${
              !activeGuideSlug ? 'opacity-100 translate-x-0.5 text-primary' : 'opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0'
            }`}
          />
        </Link>
      </div>

      {/* Dynamic Database categories folders links */}
      {sections.map((sec) => {
        const list = groupedGuides[sec] || []
        if (list.length === 0) return null

        return (
          <div key={sec} className="space-y-2">
            <span className="text-[9px] font-black uppercase text-text-muted tracking-wider flex items-center gap-1.5 pb-1 border-b border-border/20">
              {CATEGORY_ICONS[sec]} {CATEGORY_NAMES[sec] || sec}
            </span>
            <div className="flex flex-col gap-1">
              {list.map((g) => {
                // If it is the threads and fittings guide page, link it back to /guides root landing
                const isFittings = g.slug === 'threads-and-fittings'
                const href = isFittings ? '/guides' : `/guides?guide=${g.slug}`
                const isActive = isFittings ? !activeGuideSlug : activeGuideSlug === g.slug

                return (
                  <Link
                    key={g.slug}
                    href={href}
                    className={`group flex items-center justify-between p-2.5 rounded-lg border transition-all text-left ${
                      isActive
                        ? 'bg-primary/5 border-primary/40 text-primary font-bold'
                        : 'bg-transparent border-transparent text-text-secondary hover:bg-surface-variant/20 hover:text-white'
                    }`}
                  >
                    <span 
                      className={`text-xs truncate transition-all leading-normal ${isActive ? 'font-bold text-primary' : 'text-text-secondary group-hover:text-white'}`}
                      style={{ fontFamily: 'var(--font-inter), sans-serif', maxWidth: '210px' }}
                    >
                      {g.title}
                    </span>
                    <ChevronRight
                      className={`h-3 w-3 shrink-0 transition-all ${isActive ? 'opacity-100 translate-x-0.5 text-primary' : 'opacity-0 -translate-x-1 group-hover:opacity-50 group-hover:translate-x-0'}`}
                    />
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Authenticated calibration standards footprint */}
      <div className="bg-surface/80 border border-border/80 rounded-2xl p-4 space-y-2 hidden lg:block shadow-xl">
        <div className="flex items-center gap-1.5 text-primary text-xs font-bold leading-none" style={{ fontFamily: 'var(--font-orbitron)' }}>
          <BadgeCheck className="h-4 w-4 stroke-[2.5]" /> DIRECTORY STANDARD
        </div>
        <p className="text-[10px] text-text-muted leading-relaxed">
          Workshop and garage calibrated formulas. Read component alignments, fluid dimensions, clearances, and thread compatibility guides directly inside this screen.
        </p>
      </div>

    </aside>
  )
}
