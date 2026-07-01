import { createClient } from '@/lib/supabase/server'
import { ConsolidatedGuidesSidebarWithSuspense } from '@/components/ui/ConsolidatedGuidesSidebarWithSuspense'
import { ThreadSizesAndFittingsContent } from '@/components/ui/ThreadSizesAndFittingsContent'
import { SingleGuideContentPane } from '@/components/ui/SingleGuideContentPane'
import type { Guide, Step, ToolItem, PartItem } from '@/components/ui/SingleGuideContentPane'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Guides',
  description: 'Step-by-step automotive how-to guides for every skill level',
}

// Force dynamic fetch to immediately respond to ?guide= query params changes without caching constraints!
export const dynamic = 'force-dynamic'

export default async function GuidesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; guide?: string }>
}) {
  const { guide: selectedGuideSlug } = await searchParams
  const supabase = await createClient()

  // 1. Fetch ALL published guides metadata to render dynamic left menu items
  const { data: allGuides } = await supabase
    .from('guides')
    .select('slug, title, category')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const guidesList = allGuides ?? []

  // 2. Decide what to render in the right details pane:
  // If `guide` parameter is set, retrieve details of that specific guide.
  // If no parameter is set, render the default Sizes and Fittings guide.
  let activeGuideData: Guide | null = null
  let steps: Step[] = []
  let tools: ToolItem[] = []
  let parts: PartItem[] = []

  if (selectedGuideSlug && selectedGuideSlug !== 'threads-and-fittings') {
    const { data: guide } = await supabase
      .from('guides')
      .select('*')
      .eq('slug', selectedGuideSlug)
      .eq('is_published', true)
      .maybeSingle()

    if (guide) {
      activeGuideData = guide
      
      const [stepsRes, toolsRes, partsRes] = await Promise.all([
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

      steps = stepsRes.data ?? []
      tools = toolsRes.data ?? []
      parts = partsRes.data ?? []

      // Increment views (fire-and-forget)
      supabase.rpc('increment_guide_views', { p_slug: selectedGuideSlug })
    }
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 space-y-6">
      
      {/* Header */}
      <div className="pb-4 border-b border-border/40">
        <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>Automotive Guides</h1>
        <p className="text-text-muted text-sm mt-1">Step-by-step DIY guides, diagnostics formulas, and mechanical references for every skill level</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side Navigation Sidebar */}
        <ConsolidatedGuidesSidebarWithSuspense guides={guidesList} />

        {/* Guides Content Pane */}
        <div className="flex-1 bg-surface/10 rounded-2xl border border-border/40 p-6 md:p-8 min-h-125">
          {activeGuideData ? (
            <SingleGuideContentPane
              guide={activeGuideData}
              steps={steps}
              tools={tools}
              parts={parts}
            />
          ) : (
            <ThreadSizesAndFittingsContent />
          )}
        </div>
      </div>
    </div>
  )
}
