'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Send, X } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { MentionTextarea } from '@/components/ui/MentionTextarea'
import { PostContent } from '@/components/ui/PostContent'
import type { CommentWithProfile } from '@/lib/supabase/types'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'

// ── Anti-spam: max 3 comments in any 30-second window ────────────────────────
const COMMENT_SPAM_WINDOW_MS = 30_000
const COMMENT_SPAM_MAX       = 3
const commentTimestamps: number[] = []

function checkCommentSpam(): string | null {
  const now = Date.now()
  while (commentTimestamps.length > 0 && now - commentTimestamps[0] > COMMENT_SPAM_WINDOW_MS) {
    commentTimestamps.shift()
  }
  if (commentTimestamps.length >= COMMENT_SPAM_MAX) {
    const wait = Math.ceil((COMMENT_SPAM_WINDOW_MS - (now - commentTimestamps[0])) / 1000)
    return `Too many comments. Wait ${wait}s.`
  }
  commentTimestamps.push(now)
  return null
}

interface Props {
  postId: string
}

export default function CommentSection({ postId }: Props) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const { data } = await supabase
        .from('post_comments')
        .select('*, profiles(username, display_name, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(100)
      return (data ?? []) as CommentWithProfile[]
    },
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!comment.trim() || !user) return

    const spamError = checkCommentSpam()
    if (spamError) {
      toast.warning('Slow down! 🛑', { description: spamError })
      return
    }

    setSubmitting(true)
    try {
      let imageUrl: string | null = null
      if (imageFile) {
        const ext = imageFile.name.split('.').pop() ?? 'jpg'
        const path = `comment-images/${user.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('user-content')
          .upload(path, imageFile, { upsert: true })
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('user-content').getPublicUrl(path)
          imageUrl = urlData.publicUrl
        }
      }
      const { error } = await supabase.from('post_comments').insert({
        post_id: postId,
        user_id: user.id,
        content: comment.trim(),
        ...(imageUrl ? { image_url: imageUrl } : {}),
      })
      if (error) {
        toast.error('Comment not posted', { description: 'Please check your connection and try again.' })
        return
      }
      setComment('')
      setImageFile(null)
      setImagePreview(null)
      toast.success('Comment posted! 💬', { description: 'Your comment has been added to the discussion.' })
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    } finally {
      setSubmitting(false)
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-text-primary text-sm">
        {isLoading ? '…' : `${comments.length} Comment${comments.length !== 1 ? 's' : ''}`}
      </h2>

      {/* Comment form */}
      {user ? (
        <form onSubmit={handleSubmit} className="card p-4 space-y-3">
          <div className="flex gap-3 items-start">
            <DefaultAvatar className="w-8 h-8 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <MentionTextarea
                value={comment}
                onChange={setComment}
                placeholder="Write a comment… use @ to mention"
                maxLength={500}
                className="input resize-none text-sm w-full"
              />
              {/* Image preview */}
              {imagePreview && (
                <div className="relative inline-block">
                  <Image
                    src={imagePreview}
                    alt="preview"
                    width={200}
                    height={150}
                    className="rounded-lg object-cover max-h-36 w-auto border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null) }}
                    className="absolute -top-1.5 -right-1.5 bg-background rounded-full p-0.5 border border-border hover:bg-surface-variant transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-text-muted hover:text-primary transition-colors text-sm"
                >
                  <ImagePlus size={16} />
                  <span>Photo</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <button
                  type="submit"
                  disabled={submitting || !comment.trim()}
                  className="btn-primary px-3 py-1.5 text-sm flex items-center gap-1.5"
                >
                  <Send size={14} />
                  {submitting ? '…' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="card p-4 text-center text-text-muted text-sm">
          <Link href="/login" className="text-primary hover:underline">Sign in</Link> to leave a comment
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-variant shrink-0" />
                <div className="flex-1">
                  <div className="h-2 bg-surface-variant rounded w-28 mb-2" />
                  <div className="h-3 bg-surface-variant rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-text-muted text-sm text-center py-6">No comments yet. Be the first!</p>
      ) : (
        comments.map((c) => {
          const cp = c.profiles
          return (
            <div key={c.id} className="card p-4">
              <div className="flex items-start gap-3">
                {cp?.avatar_url ? (
                  <Image
                    src={cp.avatar_url}
                    alt=""
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover border border-border shrink-0"
                  />
                ) : (
                  <DefaultAvatar className="w-8 h-8 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/u/${cp?.username || ''}`}
                      className="text-text-primary text-sm font-medium hover:text-primary transition-colors"
                    >
                      {cp?.display_name || cp?.username || 'Member'}
                    </Link>
                    <span className="text-text-disabled text-xs">{timeAgo(c.created_at)}</span>
                  </div>
                  <PostContent content={c.content} />
                  {c.image_url && (
                    <div className="mt-2">
                      <Image
                        src={c.image_url}
                        alt="comment image"
                        width={400}
                        height={300}
                        className="rounded-lg object-cover max-h-64 w-auto border border-border"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
