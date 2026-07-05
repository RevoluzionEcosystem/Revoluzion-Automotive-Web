'use client'

import { Suspense } from 'react'
import { CarClubSearch } from '@/components/ui/CarClubSearch'

interface Props {
  allClubNames: string[]
}

export function CarClubSearchWithSuspense({ allClubNames }: Props) {
  return (
    <Suspense fallback={
      <div className="w-full max-w-xl h-11 bg-surface-variant rounded-2xl animate-pulse" />
    }>
      <CarClubSearch allClubNames={allClubNames} />
    </Suspense>
  )
}