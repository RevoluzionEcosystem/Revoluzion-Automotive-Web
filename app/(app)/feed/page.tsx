'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { timeAgo, getInitials } from '@/lib/utils'
import { Heart, MessageCircle, Image as ImageIcon, X, Send } from 'lucide-react'
import type { PostWithProfile } from '@/lib/supabase/types'
import toast from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

function PostCard({ post, currentUserId }: { post: PostWithProfile; currentUserId: string | null }) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const profile = post.profiles

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) { toast.error('Sign in to like posts'); return }
      const { data: existing } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('post_id', post.id)
        .eq('user_id', currentUserId)
        .single()

      if (existing) {
        await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUserId)
      } else {
        await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserId })
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  })

  return (
    <article className="card-hover p-4">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Link href={`/u/${profile?.username || post.user_id}`}>
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.display_name || 'User'}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-sm font-bold">
              {getInitials(profile?.display_name || profile?.username || 'U')}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/u/${profile?.username || post.user_id}`} className="font-semibold text-text-primary text-sm hover:text-primary transition-colors">
              {profile?.display_name || profile?.username || 'Member'}
            </Link>
            {profile?.is_verified && (
              <span className="badge-primary py-0 text-[10px]">Verified</span>
            )}
            <span className="text-text-muted text-xs">{timeAgo(post.created_at)}</span>
          </div>
          {profile?.username && (
            <span className="text-text-muted text-xs">@{profile.username}</span>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-text-primary text-sm leading-relaxed mb-3 whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Image */}
      {post.image_url && (
        <div className="mb-3 rounded-lg overflow-hidden border border-border">
          <Image
            src={post.image_url}
            alt="Post image"
            width={600}
            height={400}
            className="w-full object-cover max-h-96"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-border/50">
        <button
          onClick={() => likeMutation.mutate()}
          className="flex items-center gap-1.5 text-text-muted hover:text-error transition-colors text-sm group"
        >
          <Heart size={16} className="group-hover:fill-error transition-all" />
          <span>{post.likes_count}</span>
        </button>
        <Link
          href={`/community/post/${post.id}`}
          className="flex items-center gap-1.5 text-text-muted hover:text-primary transition-colors text-sm"
        >
          <MessageCircle size={16} />
          <span>{post.comments_count}</span>
        </Link>
      </div>
    </article>
  )
}

function CreatePost({ currentUserId }: { currentUserId: string }) {
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const queryClient = useQueryClient()

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() && !imageFile) return
    setSubmitting(true)

    let imageUrl: string | null = null
    if (imageFile) {
      const path = `posts/${currentUserId}/${Date.now()}_${imageFile.name}`
      const { error: uploadError } = await supabase.storage.from('post-images').upload(path, imageFile)
      if (uploadError) { toast.error('Image upload failed'); setSubmitting(false); return }
      const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(path)
      imageUrl = publicUrl
    }

    const { error } = await supabase.from('posts').insert({
      user_id: currentUserId,
      content: content.trim(),
      image_url: imageUrl,
    })

    if (error) {
      toast.error('Failed to post')
    } else {
      setContent('')
      setImageFile(null)
      setImagePreview(null)
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast.success('Posted!')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 mb-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's happening in the automotive world?"
        className="input resize-none text-sm min-h-[80px] mb-3 bg-background"
        maxLength={1000}
      />

      {imagePreview && (
        <div className="relative mb-3 inline-block">
          <Image src={imagePreview} alt="Preview" width={200} height={150} className="rounded-lg object-cover border border-border max-h-40 w-auto" />
          <button
            type="button"
            onClick={() => { setImageFile(null); setImagePreview(null) }}
            className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black transition-colors"
          >
            <X size={10} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-surface-variant transition-colors"
          >
            <ImageIcon size={18} />
          </button>
          <span className="text-text-muted text-xs">{content.length}/1000</span>
        </div>
        <button
          type="submit"
          disabled={submitting || (!content.trim() && !imageFile)}
          className="btn-primary py-1.5 px-4 text-sm flex items-center gap-2"
        >
          <Send size={14} />
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  )
}

export default function FeedPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as PostWithProfile[]
    },
  })

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('posts-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['feed'] })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, queryClient])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-text-primary mb-4">Community Feed</h1>

      {user && <CreatePost currentUserId={user.id} />}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-surface-variant" />
                <div className="flex-1">
                  <div className="h-3 bg-surface-variant rounded w-32 mb-2" />
                  <div className="h-2 bg-surface-variant rounded w-20" />
                </div>
              </div>
              <div className="h-4 bg-surface-variant rounded w-full mb-2" />
              <div className="h-4 bg-surface-variant rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
          <p>No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={user?.id ?? null} />
          ))}
        </div>
      )}
    </div>
  )
}
