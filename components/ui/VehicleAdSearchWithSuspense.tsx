'use client'

import { Suspense } from 'react'
import { VehicleAdSearch } from '@/components/ui/VehicleAdSearch'

interface Props {
  allTitles: string[]
}

export function VehicleAdSearchWithSuspense({ allTitles }: Props) {
  return (
    <Suspense fallback={
      <div className="w-full max-w-xl h-11 bg-surface-variant rounded-2xl animate-pulse" />
    }>
      <VehicleAdSearch allTitles={allTitles} />
    </Suspense>
  )
}
