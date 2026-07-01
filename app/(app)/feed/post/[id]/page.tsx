import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Heart, MessageCircle } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import CommentSection from './CommentSection'
import BackButton from './BackButton'
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

  const { data: post } = await supabase
    .from('posts')
    .select('*, users!posts_user_id_fkey(username, display_name, avatar_url, is_verified)')
    .eq('id', id)
    .single()

  if (!post) notFound()

  const profile = post.users

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <BackButton />

      {/* Post */}
      <article className="card p-5 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <Link href={`/u/${profile?.username || post.user_id}`}>
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover border border-border" />
            ) : (
              <DefaultAvatar className="w-10 h-10" />
            )}
          </Link>
          <div>
            <Link href={`/u/${profile?.username || post.user_id}`} className="font-semibold text-text-primary hover:text-primary transition-colors text-sm">
              {profile?.display_name || profile?.username || 'Member'}
            </Link>
            <div className="flex items-center gap-1.5 flex-wrap text-text-muted text-xs">
              <span>{timeAgo(post.created_at)}</span>
              {post.updated_at && Math.abs(new Date(post.updated_at).getTime() - new Date(post.created_at).getTime()) > 5000 && (
                <span className="text-[10px]">(edited {timeAgo(post.updated_at)})</span>
              )}
            </div>
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

      <CommentSection postId={id} />
    </div>
  )
}
