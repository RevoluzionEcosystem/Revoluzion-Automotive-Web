'use client'

import { Suspense } from 'react'
import { VehicleAdSidebar } from '@/components/ui/VehicleAdSidebar'

export function VehicleAdSidebarWithSuspense() {
  return (
    <Suspense fallback={
      <aside className="w-full lg:w-72 lg:shrink-0 lg:border-r lg:border-border/60 bg-surface/30 lg:pr-6 h-fit lg:sticky lg:top-14 overflow-y-auto pb-16 space-y-6">
        <div className="h-10 w-full bg-surface-variant rounded-xl animate-pulse" />
        <div className="space-y-2 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-full bg-surface-variant rounded-xl animate-pulse" />
          ))}
        </div>
      </aside>
    }>
      <VehicleAdSidebar />
    </Suspense>
  )
}
