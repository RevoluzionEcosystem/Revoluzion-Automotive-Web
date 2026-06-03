import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Clock, Eye, Wrench, Package, ArrowLeft, Lightbulb } from 'lucide-react'
import type { Metadata } from 'next'

const DIFF_STYLE: Record<string, string> = {
  beginner:     'text-green-400 bg-green-400/10 border-green-400/20',
  intermediate: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  advanced:     'text-red-400 bg-red-400/10 border-red-400/20',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('guides')
    .select('title, description')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!data) return { title: 'Guide' }
  return { title: data.title, description: data.description ?? undefined }
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch guide first to get the id, then fetch related data
  const { data: guide } = await supabase
    .from('guides')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!guide) notFound()

  const [{ data: steps }, { data: tools }, { data: parts }] = await Promise.all([
    supabase
      .from('guide_steps')
      .select('*')
      .eq('guide_id', guide.id)
      .order('step_number'),
    supabase
      .from('guide_tools')
      .select('*')
      .eq('guide_id', guide.id),
    supabase
      .from('guide_parts')
      .select('*, products(id, name, slug, images)')
      .eq('guide_id', guide.id),
  ])

  // Increment views (fire-and-forget)
  supabase.rpc('increment_guide_views', { p_slug: slug }).then(() => {})

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Back */}
      <Link
        href="/guides"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> All Guides
      </Link>

      {/* Cover image */}
      {guide.cover_image_url && (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-surface-variant">
          <Image
            src={guide.cover_image_url}
            alt={guide.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {guide.category && (
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
              {guide.category}
            </span>
          )}
          {guide.difficulty && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border capitalize ${DIFF_STYLE[guide.difficulty]}`}>
              {guide.difficulty}
            </span>
          )}
          {guide.estimated_minutes && (
            <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
              <Clock className="h-3 w-3" /> {guide.estimated_minutes} min
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-text-muted">
            <Eye className="h-3 w-3" /> {guide.views ?? 0} views
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>{guide.title}</h1>
        {guide.description && (
          <p className="text-text-secondary">{guide.description}</p>
        )}
      </div>

      {/* Tools & Parts sidebar-ish section */}
      {((tools ?? []).length > 0 || (parts ?? []).length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Tools */}
          {(tools ?? []).length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-5">
              <h2 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <Wrench className="h-4 w-4 text-primary" /> Tools Needed
              </h2>
              <ul className="space-y-2">
                {(tools ?? []).map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-sm">
                    <span className="text-white">{t.name}</span>
                    <span className="text-text-muted text-xs">×{t.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Parts */}
          {(parts ?? []).length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-5">
              <h2 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-primary" /> Parts Needed
              </h2>
              <ul className="space-y-2">
                {(parts ?? []).map((p: any) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    {p.products ? (
                      <Link
                        href={`/shop/product/${p.products.id}`}
                        className="text-primary hover:underline"
                      >
                        {p.name}
                      </Link>
                    ) : (
                      <span className="text-white">{p.name}</span>
                    )}
                    <span className="text-text-muted text-xs">×{p.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Steps */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Steps
          <span className="text-sm font-normal text-text-muted">({(steps ?? []).length})</span>
        </h2>

        <div className="space-y-5">
          {(steps ?? []).map((step) => (
            <div
              key={step.id}
              className="bg-surface border border-border rounded-2xl overflow-hidden"
            >
              {/* Step image */}
              {step.image_url && (
                <div className="relative w-full aspect-video bg-surface-variant">
                  <Image
                    src={step.image_url}
                    alt={step.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="p-5 space-y-3">
                {/* Step header */}
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                    {step.step_number}
                  </span>
                  <h3 className="font-semibold text-white">{step.title}</h3>
                </div>

                {/* Body */}
                {step.body && (
                  <p className="text-text-secondary text-sm leading-relaxed pl-11">
                    {step.body}
                  </p>
                )}

                {/* Tip */}
                {step.tip && (
                  <div className="ml-11 flex gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 text-sm">
                    <Lightbulb className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                    <p className="text-yellow-100">{step.tip}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
