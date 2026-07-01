import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import IndividualCarDetails from '@/components/garage/IndividualCarDetails'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: car } = await supabase
    .from('cars')
    .select('make, model, year')
    .eq('id', id)
    .single()

  if (!car) return { title: 'Garage - Vehicle Not Found' }
  return { title: `${car.year ? `${car.year} ` : ''}${car.make} ${car.model} | Revoluzion Garage` }
}

export default async function CarDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Verify car existence first
  const { data: car } = await supabase
    .from('cars')
    .select('id')
    .eq('id', id)
    .single()

  if (!car) notFound()

  return <IndividualCarDetails carId={id} />
}
