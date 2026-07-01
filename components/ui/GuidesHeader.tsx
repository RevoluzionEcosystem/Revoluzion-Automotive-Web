'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const CATEGORIES = ['engine', 'brakes', 'suspension', 'electrical', 'exterior', 'interior', 'general']

export function GuidesHeader() {
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category')

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div>
        <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>Guides</h1>
        <p className="text-text-secondary mt-1 text-sm">
          Step-by-step DIY guides for every skill level
        </p>
      </div>

      {/* Category Submenu pills */}
      <div className="flex flex-wrap gap-2 border-b border-border/40 pb-4">
        <Link
          href="/guides"
          className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider transition-all duration-300 border ${
            !activeCategory
              ? 'bg-primary text-black border-primary font-bold shadow-md shadow-primary/10'
              : 'border-border bg-white/5 text-text-secondary hover:border-primary hover:text-white'
          }`}
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/guides?category=${c}`}
            className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider transition-all duration-300 border capitalize ${
              activeCategory === c
                ? 'bg-primary text-black border-primary font-bold shadow-md shadow-primary/10'
                : 'border-border bg-white/5 text-text-secondary hover:border-primary hover:text-white'
            }`}
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            {c}
          </Link>
        ))}
      </div>
    </div>
  )
}
