import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Clock, Eye, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Guides',
  description: 'Step-by-step automotive how-to guides for every skill level',
}

export const revalidate = 300

const CATEGORIES = ['engine', 'brakes', 'suspension', 'electrical', 'exterior', 'interior', 'general']

const DIFF_STYLE: Record<string, string> = {
  beginner:     'text-green-400 bg-green-400/10 border-green-400/20',
  intermediate: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  advanced:     'text-red-400 bg-red-400/10 border-red-400/20',
}

export default async function GuidesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const supabase = await createClient()

  let q = supabase
    .from('guides')
    .select('id, slug, title, description, category, difficulty, estimated_minutes, cover_image_url, views, saves_count')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (category && CATEGORIES.includes(category)) {
    q = q.eq('category', category)
  }

  const { data: guides } = await q.limit(60)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          <span className="text-[var(--color-primary)]">Automotive</span> Guides
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-2">
          Step-by-step DIY guides for every skill level
        </p>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/guides"
          className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
            !category
              ? 'bg-[var(--color-primary)] text-black border-[var(--color-primary)] font-semibold'
              : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-white'
          }`}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/guides?category=${c}`}
            className={`px-4 py-1.5 rounded-full text-sm border transition-colors capitalize ${
              category === c
                ? 'bg-[var(--color-primary)] text-black border-[var(--color-primary)] font-semibold'
                : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-white'
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      {/* Guides grid */}
      {(guides ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-[var(--color-text-secondary)]">
          <BookOpen className="h-12 w-12 opacity-20 mb-3" />
          <p className="text-lg font-medium">No guides yet</p>
          <p className="text-sm mt-1">Check back soon for how-to content</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(guides ?? []).map((guide) => (
            <Link
              key={guide.id}
              href={`/guides/${guide.slug}`}
              className="group flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden hover:border-[var(--color-primary)]/50 transition-all"
            >
              {/* Cover image */}
              <div className="relative w-full aspect-video bg-[var(--color-surface-variant)] overflow-hidden">
                {guide.cover_image_url ? (
                  <Image
                    src={guide.cover_image_url}
                    alt={guide.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="h-10 w-10 text-[var(--color-text-muted)]" />
                  </div>
                )}
                {/* Difficulty badge */}
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border backdrop-blur-sm capitalize ${DIFF_STYLE[guide.difficulty ?? 'beginner']}`}>
                    {guide.difficulty}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-4 gap-2">
                <div>
                  {guide.category && (
                    <span className="text-xs font-medium text-[var(--color-primary)] uppercase tracking-wide">
                      {guide.category}
                    </span>
                  )}
                  <h3 className="text-sm font-semibold text-white mt-0.5 line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                    {guide.title}
                  </h3>
                  {guide.description && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                      {guide.description}
                    </p>
                  )}
                </div>

                <div className="mt-auto flex items-center gap-4 pt-2 border-t border-[var(--color-border)] text-[var(--color-text-muted)] text-xs">
                  {guide.estimated_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {guide.estimated_minutes} min
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {guide.views ?? 0}
                  </span>
                  <span className="ml-auto flex items-center gap-0.5 text-[var(--color-primary)] font-medium">
                    Read <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
