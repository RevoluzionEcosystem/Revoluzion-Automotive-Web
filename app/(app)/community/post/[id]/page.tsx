import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Heart, MessageCircle } from 'lucide-react'
import { timeAgo, getInitials } from '@/lib/utils'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('posts').select('content').eq('id', id).single()
  return { title: data?.content?.slice(0, 60) ?? 'Post' }
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: post }, { data: rawComments }] = await Promise.all([
    supabase
      .from('posts')
      .select('*, profiles(username, display_name, avatar_url, is_verified)')
      .eq('id', id)
      .single(),
    supabase
      .from('post_comments')
      .select('*, profiles(username, display_name, avatar_url)')
      .eq('post_id', id)
      .order('created_at', { ascending: true })
      .limit(100),
  ])

  if (!post) notFound()

  const comments = rawComments ?? []

  const profile = post.profiles

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/community" className="inline-flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors text-sm mb-4">
        <ArrowLeft size={16} /> Community
      </Link>

      {/* Post */}
      <article className="card p-5 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <Link href={`/u/${profile?.username || post.user_id}`}>
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-sm font-bold">
                {getInitials(profile?.display_name || profile?.username || 'U')}
              </div>
            )}
          </Link>
          <div>
            <Link href={`/u/${profile?.username || post.user_id}`} className="font-semibold text-text-primary hover:text-primary transition-colors text-sm">
              {profile?.display_name || profile?.username || 'Member'}
            </Link>
            <div className="text-text-muted text-xs">{timeAgo(post.created_at)}</div>
          </div>
        </div>

        <p className="text-text-primary leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>

        {post.image_url && (
          <Image src={post.image_url} alt="Post image" width={600} height={400} className="w-full rounded-lg object-cover border border-border mb-4 max-h-80" />
        )}

        <div className="flex items-center gap-4 pt-3 border-t border-border/50">
          <span className="flex items-center gap-1.5 text-text-muted text-sm">
            <Heart size={16} /> {post.likes_count}
          </span>
          <span className="flex items-center gap-1.5 text-text-muted text-sm">
            <MessageCircle size={16} /> {post.comments_count}
          </span>
        </div>
      </article>

      {/* Comments */}
      <div className="space-y-3">
        <h2 className="font-semibold text-text-primary text-sm">{comments.length} Comments</h2>
        {comments.map((comment) => {
          const cp = comment.profiles
          return (
            <div key={comment.id} className="card p-4">
              <div className="flex items-start gap-3">
                {cp?.avatar_url ? (
                  <Image src={cp.avatar_url} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover border border-border shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {getInitials(cp?.display_name || cp?.username || 'U')}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-text-primary text-sm font-medium">{cp?.display_name || cp?.username || 'Member'}</span>
                    <span className="text-text-disabled text-xs">{timeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-text-secondary text-sm leading-relaxed">{comment.content}</p>
                </div>
              </div>
            </div>
          )
        })}
        {comments.length === 0 && (
          <p className="text-text-muted text-sm text-center py-6">No comments yet. Be the first!</p>
        )}
      </div>
    </div>
  )
}
