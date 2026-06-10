'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { timeAgo } from '@/lib/utils'
import { Heart, MessageCircle, Image as ImageIcon, X, Send, RefreshCw, AtSign, MoreVertical, Pencil, Trash2, Flag } from 'lucide-react'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { PostContent } from '@/components/ui/PostContent'
import { LinkPreview } from '@/components/ui/LinkPreview'
import { MentionTextarea } from '@/components/ui/MentionTextarea'
import type { PostWithProfile } from '@/lib/supabase/types'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'

// ── Anti-spam: max 3 posts in any 60-second window ───────────────────────────
const POST_SPAM_WINDOW_MS = 60_000
const POST_SPAM_MAX       = 3
const postTimestamps: number[] = []

function checkPostSpam(): string | null {
  const now = Date.now()
  while (postTimestamps.length > 0 && now - postTimestamps[0] > POST_SPAM_WINDOW_MS) {
    postTimestamps.shift()
  }
  if (postTimestamps.length >= POST_SPAM_MAX) {
    const wait = Math.ceil((POST_SPAM_WINDOW_MS - (now - postTimestamps[0])) / 1000)
    return `Too many posts. Wait ${wait}s.`
  }
  postTimestamps.push(now)
  return null
}

function wasEdited(post: PostWithProfile): boolean {
  if (!post.updated_at) return false
  return Math.abs(new Date(post.updated_at).getTime() - new Date(post.created_at).getTime()) > 5000
}

type TopComment = {
  content: string
  profiles: { display_name: string | null; username: string | null; avatar_url: string | null } | null
}

function PostCard({ post, currentUserId, topComment, initialLiked = false }: { post: PostWithProfile; currentUserId: string | null; topComment?: TopComment; initialLiked?: boolean }) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const profile = post.profiles
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(post.likes_count ?? 0)
  const [imgError, setImgError] = useState(false)
  const [imgKey, setImgKey] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { setLiked(initialLiked) }, [initialLiked])
  useEffect(() => { setLikeCount(post.likes_count ?? 0) }, [post.likes_count])
  const [editOpen, setEditOpen] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [editSaving, setEditSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportSending, setReportSending] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isOwner = currentUserId != null && currentUserId === post.user_id

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) {
        toast.error('Sign in to interact', { description: 'Create an account to like and comment on posts.' })
        return
      }
      if (liked) {
        const { error } = await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUserId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserId })
        if (error) throw error
      }
    },
    onMutate: async () => {
      const prev = { liked, likeCount }
      setLiked(l => !l)
      setLikeCount(c => liked ? c - 1 : c + 1)
      return prev
    },
    onError: (_err, _vars, prev) => {
      if (prev) { setLiked(prev.liked); setLikeCount(prev.likeCount) }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  })

  async function handleEdit() {
    const trimmed = editContent.trim()
    if (!trimmed || trimmed === post.content) { setEditOpen(false); return }
    setEditSaving(true)
    const { error } = await supabase.from('posts').update({ content: trimmed }).eq('id', post.id)
    setEditSaving(false)
    if (error) { toast.error('Update failed', { description: 'Could not save your changes. Please try again.' }); return }
    toast.success('Post updated ✏️', { description: 'Your changes have been saved.' })
    setEditOpen(false)
    queryClient.invalidateQueries({ queryKey: ['feed'] })
  }

  async function handleReport() {
    if (!reportReason.trim()) { toast.error('Select a reason', { description: 'Please choose a report reason before submitting.' }); return }
    if (!currentUserId) { toast.error('Sign in to report', { description: 'You must be signed in to report posts.' }); return }
    setReportSending(true)
    // Try the RPC first (saves report + DMs admin); fall back to direct insert
    const { error: rpcError } = await supabase.rpc('report_post', {
      p_post_id: post.id,
      p_reason: reportReason,
    })
    if (rpcError) {
      const { error: insertError } = await supabase
        .from('post_reports')
        .insert({ post_id: post.id, reporter_id: currentUserId, reason: reportReason })
        .single()
      if (insertError && insertError.code !== '23505') {
        // 23505 = unique_violation (already reported) — treat as success
        setReportSending(false)
        toast.error('Report failed', { description: 'Could not submit your report. Please try again.' })
        return
      }
    }
    setReportSending(false)
    toast.success('Report submitted 🙏', { description: 'Our team will review this content shortly.' })
    setReportOpen(false)
    setReportReason('')
  }

  async function handleDelete() {
    const { error } = await supabase.from('posts').delete().eq('id', post.id)
    if (error) { toast.error('Delete failed', { description: 'Could not delete this post. Please try again.' }); return }
    toast.success('Post deleted', { description: 'The post has been permanently removed.' })
    setDeleted(true)
    setDeleteOpen(false)
    queryClient.invalidateQueries({ queryKey: ['feed'] })
  }

  if (deleted) return null

  return (
    <>
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
              <DefaultAvatar className="w-10 h-10" />
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
              {wasEdited(post) && (
                <span className="text-text-muted text-[10px]">
                  (edited {timeAgo(post.updated_at!)})
                </span>
              )}
            </div>
            {profile?.username && (
              <span className="text-text-muted text-xs">@{profile.username}</span>
            )}
          </div>

          {/* Three-dot menu — owner sees Edit/Delete, others see Report */}
          {(isOwner || (currentUserId && currentUserId !== post.user_id)) && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-variant transition-colors"
                aria-label="Post options"
              >
                <MoreVertical size={16} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 z-50 w-44 bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
                  {isOwner ? (
                    <>
                      <button
                        onClick={() => { setMenuOpen(false); setEditContent(post.content); setEditOpen(true) }}
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-variant transition-colors"
                      >
                        <Pencil size={14} />
                        Edit Post
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); setDeleteOpen(true) }}
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-error hover:bg-error/10 transition-colors"
                      >
                        <Trash2 size={14} />
                        Delete Post
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setMenuOpen(false); setReportOpen(true) }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-error hover:bg-error/10 transition-colors"
                    >
                      <Flag size={14} />
                      Report Post
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <PostContent content={post.content} />
        <LinkPreview content={post.content} />

        {/* Image */}
        {post.image_url && (
          <div className="mb-3 rounded-lg overflow-hidden border border-border">
            {imgError ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 bg-surface-variant">
                <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12 opacity-50">
                  <rect x="4" y="8" width="40" height="32" rx="3" stroke="#9CA3AF" strokeWidth="2" />
                  <path d="M4 30 L15 19 L22 26 L30 16 L44 30" stroke="#9CA3AF" strokeWidth="2" strokeLinejoin="round" />
                  <circle cx="14" cy="18" r="3" stroke="#9CA3AF" strokeWidth="2" />
                  <path d="M26 8 L22 22 L30 26 L26 40" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-text-muted text-xs">Image failed to load</p>
                <button
                  onClick={() => { setImgError(false); setImgKey((k) => k + 1) }}
                  className="flex items-center gap-1.5 text-primary text-xs border border-primary/30 px-3 py-1 rounded-md hover:bg-primary/10 transition-colors"
                >
                  <RefreshCw size={12} /> Reload
                </button>
              </div>
            ) : (
              <Image
                key={imgKey}
                src={post.image_url}
                alt="Post image"
                width={600}
                height={400}
                className="w-full object-cover max-h-96"
                onError={() => setImgError(true)}
              />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-border/50">
          <button
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className={`flex items-center gap-1.5 transition-colors text-sm disabled:opacity-60 ${
              liked ? 'text-error' : 'text-text-muted hover:text-error'
            }`}
          >
            <Heart
              size={16}
              className="transition-all"
              style={liked ? { fill: 'currentColor' } : undefined}
            />
            <span>{likeCount}</span>
          </button>
          <Link
            href={`/community/post/${post.id}`}
            className="flex items-center gap-1.5 text-text-muted hover:text-primary transition-colors text-sm"
          >
            <MessageCircle size={16} />
            <span>{post.comments_count}</span>
          </Link>
        </div>

        {/* Top comment preview */}
        {topComment && (
          <div className="mt-2 pt-2 border-t border-border/30 flex items-start gap-2">
            {topComment.profiles?.avatar_url ? (
              <Image
                src={topComment.profiles.avatar_url}
                alt=""
                width={24}
                height={24}
                className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5"
              />
            ) : (
              <DefaultAvatar className="w-6 h-6 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0 bg-surface-variant rounded px-2.5 py-1.5">
              <span className="block font-medium text-text-primary text-[11px] mb-0.5">
                {topComment.profiles?.display_name || topComment.profiles?.username || 'Member'}
              </span>
              <div className="text-text-secondary text-xs line-clamp-2">
                <PostContent content={topComment.content} />
              </div>
            </div>
          </div>
        )}
      </article>

      {/* Edit modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
              <h2 className="font-semibold text-text-primary" style={{ fontFamily: 'var(--font-orbitron)' }}>Edit Post</h2>
              <button onClick={() => setEditOpen(false)} className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-variant transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              <MentionTextarea
                value={editContent}
                onChange={setEditContent}
                placeholder="What's on your mind?"
                className="input resize-none text-sm min-h-[100px] w-full bg-background"
                maxLength={1000}
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-text-muted text-xs">{editContent.length}/1000</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditOpen(false)}
                    className="px-4 py-1.5 rounded-lg text-sm text-text-muted border border-border hover:bg-surface-variant transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={editSaving || !editContent.trim()}
                    className="btn-primary py-1.5 px-4 text-sm"
                  >
                    {editSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm shadow-xl p-6 text-center">
            <Trash2 size={32} className="mx-auto mb-3 text-error opacity-80" />
            <h2 className="font-semibold text-text-primary mb-1" style={{ fontFamily: 'var(--font-orbitron)' }}>Delete Post?</h2>
            <p className="text-text-muted text-sm mb-5">This cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteOpen(false)}
                className="px-5 py-2 rounded-lg text-sm border border-border text-text-muted hover:bg-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 rounded-lg text-sm bg-error text-white hover:bg-error/80 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Post modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text-primary" style={{ fontFamily: 'var(--font-orbitron)' }}>Report Post</h2>
              <button
                onClick={() => { setReportOpen(false); setReportReason('') }}
                className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-variant transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-text-muted text-sm mb-4">Why are you reporting this post?</p>
            <div className="space-y-2 mb-5">
              {['Spam or misleading', 'Inappropriate content', 'Harassment or hate speech', 'Misinformation', 'Other'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReportReason(r)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm border transition-colors ${
                    reportReason === r
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-text-secondary hover:bg-surface-variant'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setReportOpen(false); setReportReason('') }}
                className="flex-1 px-4 py-2 rounded-lg text-sm border border-border text-text-muted hover:bg-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={reportSending || !reportReason}
                className="flex-1 px-4 py-2 rounded-lg text-sm bg-error text-white hover:bg-error/80 transition-colors disabled:opacity-50"
              >
                {reportSending ? 'Sending…' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
    if (file.size > 5 * 1024 * 1024) { toast.error('Image too large', { description: 'Please choose an image under 5 MB.' }); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() && !imageFile) return

    const spamError = checkPostSpam()
    if (spamError) {
      toast.warning('Slow down! 🛑', { description: spamError })
      return
    }

    setSubmitting(true)

    let imageUrl: string | null = null
    if (imageFile) {
      const path = `posts/${currentUserId}/${Date.now()}_${imageFile.name}`
      const { error: uploadError } = await supabase.storage.from('post-images').upload(path, imageFile, { cacheControl: '31536000' })
      if (uploadError) { toast.error('Image upload failed', { description: 'Could not upload your photo. Please try again.' }); setSubmitting(false); return }
      const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(path)
      imageUrl = publicUrl
    }

    const { error } = await supabase.from('posts').insert({
      user_id: currentUserId,
      content: content.trim(),
      image_url: imageUrl,
    })

    if (error) {
      toast.error('Post failed', { description: 'Could not publish your post. Please try again.' })
    } else {
      setContent('')
      setImageFile(null)
      setImagePreview(null)
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast.success('Post published! 🚀', { description: 'Your post is now live in the community feed.' })
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 mb-4">
      <MentionTextarea
        value={content}
        onChange={setContent}
        placeholder="What's happening in the automotive world? Use @ to mention members."
        className="input resize-none text-sm min-h-[80px] mb-3 bg-background w-full"
        maxLength={1000}
      />
      <LinkPreview content={content} />

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
            title="Add image"
          >
            <ImageIcon size={18} />
          </button>
          <div className="flex items-center gap-1 text-text-muted/50 text-xs" title="Type @ to mention members">
            <AtSign size={13} />
            <span>mention</span>
          </div>
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

  const userId = user?.id ?? null

  const { data: feedData, isLoading } = useQuery({
    queryKey: ['feed', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, user_id, content, image_url, likes_count, comments_count, car_id, created_at, updated_at, profiles(id, username, display_name, avatar_url, is_verified)')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      const posts = (data ?? []).map((r: any) => ({
        ...r,
        profiles: Array.isArray(r.profiles) ? (r.profiles[0] ?? null) : (r.profiles ?? null),
      })) as PostWithProfile[]

      const postIds = posts.map(p => p.id)
      const commentMap: Record<string, TopComment> = {}
      if (postIds.length > 0) {
        const { data: comments } = await supabase
          .from('post_comments')
          .select('post_id, content, profiles(display_name, username, avatar_url)')
          .in('post_id', postIds)
          .order('created_at', { ascending: false })
          .limit(postIds.length * 3)
        for (const c of (comments ?? [])) {
          const rawProfiles = (c as { post_id: string; content: string; profiles: unknown }).profiles
          const profiles = Array.isArray(rawProfiles) ? (rawProfiles[0] as TopComment['profiles']) ?? null : rawProfiles as TopComment['profiles']
          if (!commentMap[(c as { post_id: string }).post_id]) {
            commentMap[(c as { post_id: string }).post_id] = { content: (c as { content: string }).content, profiles }
          }
        }
      }

      // Fetch which posts the current user has liked
      let likedSet = new Set<string>()
      if (userId && postIds.length > 0) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', userId)
          .in('post_id', postIds)
        likedSet = new Set((likes ?? []).map(r => (r as { post_id: string }).post_id))
      }

      return { posts, commentMap, likedSet }
    },
  })

  const posts = feedData?.posts ?? []
  const commentMap = feedData?.commentMap ?? {}
  const likedSet = feedData?.likedSet ?? new Set<string>()

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
      <h1 className="text-xl font-bold gradient-text mb-4" style={{ fontFamily: 'var(--font-orbitron)' }}>Community Feed</h1>

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
            <PostCard key={post.id} post={post} currentUserId={user?.id ?? null} topComment={commentMap[post.id]} initialLiked={likedSet.has(post.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
