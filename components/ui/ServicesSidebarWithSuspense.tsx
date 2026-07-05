'use client'

import { Suspense } from 'react'
import { ServicesSidebar } from '@/components/ui/ServicesSidebar'

export function ServicesSidebarWithSuspense() {
  return (
    <Suspense fallback={
      <aside className="w-full lg:w-72 lg:shrink-0 lg:border-r lg:border-border/60 bg-surface/30 lg:pr-6 h-fit lg:h-[calc(100vh-5rem)] lg:sticky lg:top-14 overflow-y-auto pb-16 space-y-6">
        <div className="space-y-1.5 pb-4 border-b border-border/40">
          <div className="h-3 w-24 bg-surface-variant rounded-md animate-pulse" />
          <div className="h-4 w-36 bg-surface-variant rounded-md animate-pulse" />
        </div>
        <div className="h-10 w-full bg-surface-variant rounded-xl animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-full bg-surface-variant rounded-xl animate-pulse" />
          ))}
        </div>
      </aside>
    }>
      <ServicesSidebar />
    </Suspense>
  )
}
