'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface SidebarSectionItem {
  key: string
  label: string
  href: string
  isActive: boolean
  icon?: React.ReactNode
}

export interface SidebarSection {
  headerText: string
  headerIcon?: React.ReactNode
  items: SidebarSectionItem[]
}

interface Props {
  sections: SidebarSection[]
  className?: string
  footerWidget?: React.ReactNode
}

export function StandardSubmenuSidebar({ sections, className = '', footerWidget }: Props) {
  return (
    <aside className={`w-full lg:w-64 lg:shrink-0 lg:border-r lg:border-border/60 bg-surface/30 lg:pr-6 h-fit lg:h-[calc(100vh-5rem)] lg:sticky lg:top-14 overflow-y-auto pb-16 space-y-6 ${className}`}>
      {sections.map((sect, sIdx) => {
        if (sect.items.length === 0) return null

        return (
          <div key={sect.headerText || sIdx} className="space-y-1.5 first:pt-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8A90A0] flex items-center gap-1.5 pb-1 border-b border-border/20" style={{ fontFamily: 'var(--font-orbitron)' }}>
              {sect.headerIcon} {sect.headerText}
            </span>
            <div className="flex flex-col gap-0.5">
              {sect.items.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`group flex items-center justify-between py-1 px-2.5 rounded-lg border transition-all text-left ${
                    item.isActive
                      ? 'bg-primary/5 border-primary/40 text-primary font-bold shadow-md shadow-primary/5'
                      : 'bg-transparent border-transparent text-text-secondary hover:border-border/80 hover:bg-surface-variant/30 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {item.icon}
                    <span 
                      className={`text-xs truncate transition-all leading-normal ${item.isActive ? 'font-bold text-primary' : 'text-text-secondary group-hover:text-white'}`}
                      style={{ fontFamily: 'var(--font-inter), sans-serif' }}
                    >
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight
                    className={`h-3 w-3 shrink-0 transition-transform ${item.isActive ? 'opacity-100 translate-x-0.5 text-primary' : 'opacity-0 -translate-x-1 group-hover:opacity-50 group-hover:translate-x-0'}`}
                  />
                </Link>
              ))}
            </div>
          </div>
        )
      })}

      {footerWidget}
    </aside>
  )
}
