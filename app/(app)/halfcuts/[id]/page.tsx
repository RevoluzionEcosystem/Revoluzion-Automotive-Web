import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { HalfcutDetailClient } from './HalfcutDetailClient'
import type { HalfcutWithUser } from '@/lib/supabase/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: halfcut } = await supabase
    .from('halfcuts')
    .select('title')
    .eq('id', id)
    .single()

  return {
    title: halfcut ? `${halfcut.title} — Spares Bundle` : 'Halfcut Donor Details',
    description: 'Explore full mechanical setups, conversions, and chassis-cut sections catalog.',
  }
}

export const dynamic = 'force-dynamic'

export default async function HalfcutDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch halfcut carrier with fully linked user profile & all stripped nested items database rows
  const { data: halfcut } = await supabase
    .from('halfcuts')
    .select('*, users!halfcuts_user_id_fkey(username, display_name, avatar_url, phone), halfcut_items(*)')
    .eq('id', id)
    .single()

  if (!halfcut) {
    notFound()
  }

  // Cast constraint safely matching Type Aliasing rules
  const castHalfcut = halfcut as HalfcutWithUser

  return (
    <div className="w-full bg-[#0A0A0A] min-h-screen">
      <HalfcutDetailClient halfcut={castHalfcut} />
    </div>
  )
}