'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, ShieldCheck, Car, Wrench, FolderHeart, BadgeCheck } from 'lucide-react'

export function GarageSidebar() {
  const pathname = usePathname()

  const menuItems = [
    {
      href: '/garage',
      title: 'Explore Garages',
      subtitle: 'All User Collections',
      icon: <Car className="h-4 w-4" />
    },
    {
      href: '/garage/builds',
      title: 'Community Builds',
      subtitle: 'Dynamic Modification Logs',
      icon: <Wrench className="h-4 w-4" />
    },
    {
      href: '/garage/me',
      title: 'My Collection',
      subtitle: 'Manage Own Vehicles',
      icon: <FolderHeart className="h-4 w-4" />
    }
  ]

  return (
    <aside className="w-full lg:w-72 lg:shrink-0 lg:border-r lg:border-border/60 bg-surface/30 lg:pr-6 h-fit lg:h-[calc(100vh-5rem)] lg:sticky lg:top-14 overflow-y-auto pb-16 space-y-6">
      
      {/* Sidebar header */}
      <div className="space-y-1.5 pb-4 border-b border-border/40">
        <span className="text-[10px] font-black uppercase text-primary tracking-widest" style={{ fontFamily: 'var(--font-orbitron)' }}>
          REVOLUZION GARAGE
        </span>
        <h2 className="text-sm font-bold text-white tracking-wide uppercase style-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
          GARAGE HUB
        </h2>
      </div>

      {/* Navigation nodes layout */}
      <nav className="flex flex-col gap-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/garage' && pathname === '/garage')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                isActive
                  ? 'bg-primary/5 border-primary/40 text-primary font-bold shadow-lg shadow-primary/5'
                  : 'bg-transparent border-transparent text-text-secondary hover:border-border/80 hover:bg-surface-variant/30 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-primary/25 text-primary border border-primary/30'
                      : 'bg-[#1C1F26] text-text-muted group-hover:text-text-secondary group-hover:bg-[#252934]'
                  }`}
                >
                  {item.icon}
                </div>
                <div>
                  <h4
                    className={`text-xs font-semibold leading-none transition-colors ${
                      isActive ? 'text-white font-extrabold' : 'text-text-secondary group-hover:text-white'
                    }`}
                    style={{ fontFamily: 'var(--font-inter), sans-serif' }}
                  >
                    {item.title}
                  </h4>
                  <span className="text-[9.5px] text-text-muted mt-1 block leading-none font-medium truncate max-w-35">
                    {item.subtitle}
                  </span>
                </div>
              </div>

              <ChevronRight
                className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                  isActive ? 'opacity-100 translate-x-0.5 text-primary' : 'opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0'
                }`}
              />
            </Link>
          )
        })}
      </nav>

      {/* Verified stamp footer */}
      <div className="bg-surface/80 border border-border/80 rounded-2xl p-4 space-y-2.5 hidden lg:block shadow-xl">
        <div className="flex items-center gap-1.5 text-primary text-xs font-bold leading-none style-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
          <BadgeCheck className="h-4 w-4 stroke-[2.5]" /> WORLDWIDE DIRECTORY
        </div>
        <p className="text-[10px] text-text-muted leading-relaxed">
          Revoluzion Garage is a fully peer-to-peer calibrated directory connecting custom builds, project specifications, and dyno-matched modification logs.
        </p>
      </div>

    </aside>
  )
}
