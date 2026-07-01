'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BackButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors text-sm mb-4"
    >
      <ArrowLeft size={16} /> Back
    </button>
  )
}
