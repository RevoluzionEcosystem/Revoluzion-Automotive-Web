'use client'

import { Suspense } from 'react'
import { GuidesHeader } from '@/components/ui/GuidesHeader'

export function GuidesHeaderWithSuspense() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold gradient-text animate-pulse" style={{ fontFamily: 'var(--font-orbitron)' }}>Guides</h1>
          <div className="h-4 w-48 bg-surface-variant rounded-md animate-pulse mt-1" />
        </div>
        <div className="flex flex-wrap gap-2 border-b border-border/40 pb-4">
          <div className="h-8 w-16 bg-surface-variant rounded-full animate-pulse" />
          <div className="h-8 w-24 bg-surface-variant rounded-full animate-pulse" />
          <div className="h-8 w-24 bg-surface-variant rounded-full animate-pulse" />
        </div>
      </div>
    }>
      <GuidesHeader />
    </Suspense>
  )
}
