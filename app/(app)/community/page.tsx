import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { MessageSquare, Heart } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import type { Metadata } from 'next'
import type { PostWithUser } from '@/lib/supabase/types'

export const metadata: Metadata = {
  title: 'Community',
  description: 'Explore posts and discussions from the Revoluzion automotive community',
}

export const revalidate = 60

export default async function CommunityPage() {
  const supabase = await createClient()

  const { data: posts = [] } = await supabase
    .from('posts')
    .select('*, users(username, display_name, avatar_url, is_verified)')
    .order('created_at', { ascending: false })
    .limit(60)

  const typedPosts = posts as PostWithUser[]

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>Community</h1>
        <p className="text-text-muted text-sm mt-1">Latest posts and discussions</p>
      </div>

      {typedPosts.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">No posts yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {typedPosts.map((post) => {
            const profile = post.users
            return (
              <Link key={post.id} href={`/community/post/${post.id}`} className="card-hover group">
                {post.image_url && (
                  <div className="aspect-video overflow-hidden">
                    <Image
                      src={post.image_url}
                      alt="Post"
                      width={400}
                      height={225}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-4">
                  {/* Author */}
                  <div className="flex items-center gap-2 mb-3">
                    {profile?.avatar_url ? (
                      <Image src={profile.avatar_url} alt="" width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <DefaultAvatar className="w-6 h-6" />
                    )}
                    <span className="text-text-secondary text-xs">{profile?.display_name || profile?.username || 'Member'}</span>
                    <span className="text-text-disabled text-xs ml-auto">{timeAgo(post.created_at)}</span>
                  </div>

                  <p className="text-text-primary text-sm line-clamp-3 leading-relaxed mb-3">{post.content}</p>

                  <div className="flex items-center gap-4 text-text-muted text-xs">
                    <span className="flex items-center gap-1">
                      <Heart size={12} /> {post.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} /> {post.comments_count}
                    </span>
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
