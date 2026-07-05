'use client'

import React, { Suspense } from 'react'
import { HalfcutSidebar } from './HalfcutSidebar'

interface Props {
  className?: string
}

export function HalfcutSidebarWithSuspense({ className = '' }: Props) {
  return (
    <Suspense fallback={
      <div className="w-full lg:w-64 lg:shrink-0 bg-surface/30 h-fit lg:h-[calc(100vh-5rem)] lg:sticky lg:top-14 border border-slate-800 rounded-2xl animate-pulse" />
    }>
      <HalfcutSidebar className={className} />
    </Suspense>
  )
}