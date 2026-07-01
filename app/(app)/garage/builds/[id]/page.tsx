import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import IndividualBuildDetailsClient from '@/components/garage/IndividualBuildDetailsClient'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('builds').select('title').eq('id', id).single()
  return { title: data?.title ?? 'Build Details | Revoluzion Garage' }
}

export default async function BuildDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Verify build existence first
  const { data: build } = await supabase
    .from('builds')
    .select('id')
    .eq('id', id)
    .single()

  if (!build) notFound()

  return <IndividualBuildDetailsClient buildId={id} />
}