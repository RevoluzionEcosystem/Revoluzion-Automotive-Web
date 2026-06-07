import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Calendar, Users, UserCheck, Car, Wrench, MessageSquare, Heart } from 'lucide-react'
import { timeAgo, formatDate } from '@/lib/utils'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('display_name, username, bio, avatar_url')
    .eq('username', username)
    .single()

  if (!data) return { title: 'Member Not Found' }

  return {
    title: `${data.display_name || data.username} (@${data.username})`,
    description: data.bio || `Check out ${data.display_name || data.username}'s profile on Revoluzion Automotive`,
    openGraph: {
      title: `${data.display_name || data.username} on Revoluzion`,
      description: data.bio || undefined,
      images: data.avatar_url ? [{ url: data.avatar_url }] : [],
    },
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, location, is_verified, role, followers_count, following_count, garage_count, created_at, instagram, tiktok, youtube, facebook, twitter_x, website')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  // Parallel fetch: cars, builds, posts
  const [{ data: carsRaw }, { data: buildsRaw }, { data: postsRaw }] = await Promise.all([
    supabase.from('cars').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(6),
    supabase.from('builds').select('id, title, image_url, likes_count, created_at').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(6),
    supabase.from('posts').select('id, content, image_url, likes_count, comments_count, created_at').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(6),
  ])

  const cars = carsRaw ?? []
  const builds = buildsRaw ?? []
  const posts = postsRaw ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Profile header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.display_name || profile.username || ''}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover border-2 border-border shrink-0"
              priority
            />
          ) : (
            <DefaultAvatar className="w-24 h-24 border-2 shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>
                {profile.display_name || profile.username}
              </h1>
              {profile.is_verified && (
                <div className="flex items-center gap-1 badge-primary text-xs">
                  <UserCheck size={11} /> Verified
                </div>
              )}
              {profile.role && profile.role !== 'member' && (
                <span className="badge text-xs capitalize">{profile.role}</span>
              )}
            </div>

            <div className="text-text-muted text-sm mb-3">@{profile.username}</div>

            {profile.bio && (
              <p className="text-text-secondary text-sm leading-relaxed mb-3">{profile.bio}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-text-muted">
              {profile.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-primary" /> {profile.location}
                </div>
              )}
              {profile.created_at && (
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-primary" /> Joined {formatDate(profile.created_at, 'MMMM yyyy')}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-5 mt-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-text-primary font-bold">{profile.followers_count ?? 0}</div>
                <div className="text-text-muted text-xs">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-text-primary font-bold">{profile.following_count ?? 0}</div>
                <div className="text-text-muted text-xs">Following</div>
              </div>
              <div className="text-center">
                <div className="text-text-primary font-bold">{builds.length}</div>
                <div className="text-text-muted text-xs">Builds</div>
              </div>
            </div>
          </div>

          <button className="btn-primary shrink-0 sm:self-start flex items-center gap-2">
            <Users size={14} /> Follow
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Builds */}
        {builds.length > 0 && (
          <div className="lg:col-span-2">
            <h2 className="font-semibold text-text-primary flex items-center gap-2 mb-3">
              <Wrench size={16} className="text-primary" /> Builds ({builds.length})
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {builds.map((build) => (
                <Link key={build.id} href={`/builds/${build.id}`} className="card-hover group overflow-hidden">
                  <div className="aspect-video bg-surface-variant overflow-hidden">
                    {build.image_url ? (
                      <Image src={build.image_url} alt={build.title} width={300} height={170} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Wrench size={24} className="text-primary/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-text-primary text-sm font-medium truncate">{build.title}</div>
                    <div className="flex items-center gap-1 text-text-muted text-xs mt-1">
                      <Heart size={11} /> {build.likes_count}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Side: Cars + Posts */}
        <div className="space-y-6">
          {/* Cars */}
          {cars.length > 0 && (
            <div>
              <h2 className="font-semibold text-text-primary flex items-center gap-2 mb-3">
                <Car size={16} className="text-primary" /> Garage ({cars.length})
              </h2>
              <div className="space-y-2">
                {cars.map((car) => (
                  <div key={car.id} className="card p-3 flex items-center gap-3">
                    {car.image_url ? (
                      <Image src={car.image_url} alt={`${car.make} ${car.model}`} width={44} height={36} className="w-11 h-9 rounded-lg object-cover border border-border shrink-0" />
                    ) : (
                      <div className="w-11 h-9 rounded-lg bg-surface-variant flex items-center justify-center shrink-0">
                        <Car size={16} className="text-primary/40" />
                      </div>
                    )}
                    <div>
                      <div className="text-text-primary text-sm font-medium">{car.make} {car.model}</div>
                      <div className="text-text-muted text-xs">{car.year}{car.color ? ` · ${car.color}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent posts */}
          {posts.length > 0 && (
            <div>
              <h2 className="font-semibold text-text-primary flex items-center gap-2 mb-3">
                <MessageSquare size={16} className="text-primary" /> Posts
              </h2>
              <div className="space-y-2">
                {posts.map((post) => (
                  <Link key={post.id} href={`/community/post/${post.id}`} className="card-hover p-3 block">
                    <p className="text-text-secondary text-sm line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-text-muted text-xs">
                      <span className="flex items-center gap-1"><Heart size={11} /> {post.likes_count}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={11} /> {post.comments_count}</span>
                      <span className="ml-auto">{timeAgo(post.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
