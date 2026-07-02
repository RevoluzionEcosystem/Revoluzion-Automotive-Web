'use client'

import { Suspense } from 'react'
import { PremiumLooseSearch } from '@/components/ui/PremiumLooseSearch'

interface Props {
  allListingsTitles: string[]
}

export function PremiumLooseSearchWithSuspense({ allListingsTitles }: Props) {
  return (
    <Suspense fallback={
      <div className="w-full h-11 bg-surface-variant rounded-2xl animate-pulse" />
    }>
      <PremiumLooseSearch allListingsTitles={allListingsTitles} />
    </Suspense>
  )
}
