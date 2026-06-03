import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Heart, Wrench } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import type { Metadata } from 'next'

export const revalidate = 300

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('builds').select('title').eq('id', id).single()
  return { title: data?.title ?? 'Build' }
}

export default async function BuildDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: build } = await supabase
    .from('builds')
    .select('*, profiles(username, display_name, avatar_url, is_verified), cars(make, model, year, color, image_url)')
    .eq('id', id)
    .single()

  if (!build) notFound()

  const profile = build.profiles
  const car = build.cars

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link href="/builds" className="inline-flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors text-sm mb-4">
        <ArrowLeft size={16} /> Back to Builds
      </Link>

      {/* Main image */}
      {build.image_url && (
        <div className="rounded-xl overflow-hidden mb-6 border border-border">
          <Image
            src={build.image_url}
            alt={build.title}
            width={900}
            height={500}
            className="w-full object-cover max-h-96"
            priority
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            {car && (
              <span className="badge-primary mb-3 inline-flex">
                <Wrench size={12} /> {car.year} {car.make} {car.model}
              </span>
            )}
            <h1 className="text-2xl font-bold gradient-text mb-3" style={{ fontFamily: 'var(--font-orbitron)' }}>{build.title}</h1>

            {/* Builder */}
            {profile && (
              <Link href={`/u/${profile.username}`} className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt="" width={28} height={28} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <DefaultAvatar className="w-7 h-7" />
                )}
                <span>Built by</span>
                <span className="text-text-primary font-medium">{profile.display_name || profile.username}</span>
                <span className="text-text-disabled">· {timeAgo(build.created_at)}</span>
              </Link>
            )}
          </div>

          {build.description && (
            <div className="card p-5">
              <h2 className="font-semibold text-text-primary mb-3">About this build</h2>
              <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">{build.description}</p>
            </div>
          )}

          {/* Mods list */}
          {build.mods && build.mods.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-text-primary mb-3">Modifications</h2>
              <ul className="space-y-2">
                {build.mods.map((mod: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-primary mt-0.5">›</span>
                    <span>{mod}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Side info */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 text-text-muted mb-4">
              <Heart size={16} className="text-error" />
              <span className="text-sm">{build.likes_count} likes</span>
            </div>
            <button className="btn-primary w-full flex items-center justify-center gap-2">
              <Heart size={16} /> Like this Build
            </button>
          </div>

          {/* Car card */}
          {car && (
            <div className="card p-5">
              <h3 className="font-semibold text-text-primary mb-3 text-sm">The Car</h3>
              {car.image_url && (
                <Image
                  src={car.image_url}
                  alt={`${car.make} ${car.model}`}
                  width={300}
                  height={180}
                  className="w-full rounded-lg object-cover mb-3 border border-border"
                />
              )}
              <div className="text-text-secondary text-sm">
                <div className="font-semibold text-text-primary">{car.make} {car.model}</div>
                <div className="text-text-muted">{car.year}{car.color ? ` · ${car.color}` : ''}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
