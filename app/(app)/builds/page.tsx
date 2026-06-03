import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Wrench, Heart } from 'lucide-react'
import { timeAgo, getInitials } from '@/lib/utils'
import type { Metadata } from 'next'
import type { BuildWithProfile } from '@/lib/supabase/types'

export const metadata: Metadata = {
  title: 'Builds',
  description: 'Explore car builds and modifications from the Revoluzion community',
}

export const revalidate = 300

export default async function BuildsPage() {
  const supabase = await createClient()

  const { data: builds = [] } = await supabase
    .from('builds')
    .select('*, profiles(username, display_name, avatar_url, is_verified), cars(make, model, year)')
    .order('created_at', { ascending: false })
    .limit(60)

  const typedBuilds = builds as BuildWithProfile[]

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Builds</h1>
          <p className="text-text-muted text-sm mt-1">Community car builds and modifications</p>
        </div>
      </div>

      {typedBuilds.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <Wrench size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">No builds yet</p>
          <p className="text-sm mt-1">Be the first to share your build!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {typedBuilds.map((build) => {
            const profile = build.profiles
            const car = build.cars
            return (
              <Link key={build.id} href={`/builds/${build.id}`} className="card-hover group overflow-hidden">
                {/* Image */}
                <div className="aspect-video bg-surface-variant overflow-hidden">
                  {build.image_url ? (
                    <Image
                      src={build.image_url}
                      alt={build.title}
                      width={400}
                      height={225}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-card">
                      <Wrench size={32} className="text-primary/40" />
                    </div>
                  )}
                </div>

                <div className="p-4">
                  {car && (
                    <div className="badge-primary text-xs mb-2 inline-flex">
                      {car.year} {car.make} {car.model}
                    </div>
                  )}
                  <h3 className="font-semibold text-text-primary mb-2 line-clamp-2">{build.title}</h3>

                  {build.description && (
                    <p className="text-text-muted text-xs line-clamp-2 mb-3">{build.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {profile?.avatar_url ? (
                        <Image src={profile.avatar_url} alt="" width={20} height={20} className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[9px] font-bold">
                          {getInitials(profile?.display_name || profile?.username || 'U')}
                        </div>
                      )}
                      <span className="text-text-muted text-xs">{profile?.display_name || profile?.username || 'Member'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-text-muted text-xs">
                      <Heart size={12} />
                      <span>{build.likes_count}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
