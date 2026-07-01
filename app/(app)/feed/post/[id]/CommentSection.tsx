'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Send, X } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { MentionTextarea } from '@/components/ui/MentionTextarea'
import { PostContent } from '@/components/ui/PostContent'
import type { CommentWithUser } from '@/lib/supabase/types'
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

  // Track parent comment expand threads, replying states, etc.
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({})
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null)

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
        .select('*, users!post_comments_user_id_fkey(username, display_name, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(150)
      return (data ?? []) as CommentWithUser[]
    },
  })

  // Group comments into parent comments and children (replies)
  const { parentComments, childComments } = useQuery({
    queryKey: ['post-comments-grouped', comments],
    queryFn: () => {
      const parents = comments.filter((c: any) => !c.parent_id)
      const children = comments.filter((c: any) => c.parent_id)
      return { parentComments: parents, childComments: children }
    },
    enabled: comments.length >= 0,
    initialData: { parentComments: [], childComments: [] }
  }).data

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
        parent_id: replyingToCommentId,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      })
      if (error) {
        toast.error('Comment not posted', { description: 'Please check your connection and try again.' })
        return
      }
      setComment('')
      setImageFile(null)
      setImagePreview(null)
      if (replyingToCommentId) {
        const pId = replyingToCommentId
        setExpandedThreads(prev => ({ ...prev, [pId]: true }))
        setReplyingToCommentId(null)
      }
      toast.success('Comment posted! 💬', { description: 'Your comment has been added to the discussion.' })
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    } finally {
      setSubmitting(false)
    }
  }

  function handleReplyToUser(username: string, parentCommentId: string) {
    if (!user) {
      toast.error('Sign in required 🔒')
      return
    }
    setReplyingToCommentId(parentCommentId)
    setExpandedThreads(prev => ({ ...prev, [parentCommentId]: true }))
    setComment(`@${username} `)
    
    // Smooth scroll down to quick input field
    const el = document.getElementById(`full-comment-input`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
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
        <form onSubmit={handleSubmit} id="full-comment-input" className="card p-4 space-y-3 bg-black border border-white/5 animate-fade-in">
          {replyingToCommentId && (
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg text-xs text-primary">
              <span className="font-medium animate-pulse">Replying to comment thread...</span>
              <button
                type="button"
                onClick={() => setReplyingToCommentId(null)}
                className="text-text-muted hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}
          <div className="flex gap-3 items-start">
            <DefaultAvatar className="w-8 h-8 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <MentionTextarea
                value={comment}
                onChange={setComment}
                placeholder={replyingToCommentId ? "Write a reply…" : "Write a comment… use @ to mention"}
                maxLength={500}
                className="input resize-none text-sm w-full bg-black text-white border border-white/10"
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
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-variant shrink-0" />
                <div className="grow">
                  <div className="h-4 bg-muted rounded w-24 mb-2" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-text-muted text-sm text-center py-6">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {parentComments.map((parent) => {
            const replies = childComments.filter((c: any) => c.parent_id === parent.id)
            const isThreadExpanded = !!expandedThreads[parent.id]
            const cp = parent.users

            return (
              <div key={parent.id} className="card p-4 space-y-3">
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
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/u/${cp?.username || ''}`}
                          className="text-text-primary text-sm font-semibold hover:text-primary transition-colors"
                        >
                          {cp?.display_name || cp?.username || 'Member'}
                        </Link>
                        <span className="text-text-muted text-xs">{timeAgo(parent.created_at)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleReplyToUser(cp?.username || '', parent.id)}
                        className="text-xs text-primary hover:underline"
                      >
                        Reply
                      </button>
                    </div>
                    <div 
                      onClick={() => handleReplyToUser(cp?.username || '', parent.id)}
                      className="text-text-secondary comment-body leading-normal comment-slate py-1.5 px-3 rounded-lg border border-white/5 relative group/comment cursor-pointer transition-all duration-200 hover:brightness-90 select-none overflow-hidden"
                    >
                      <PostContent content={parent.content} />

                      {/* Hover overlay with word click to reply */}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/comment:opacity-100 transition-opacity duration-200 flex items-center justify-end pr-3">
                        <span className="text-[9px] text-primary font-bold tracking-widest uppercase bg-slate-950/80 border border-primary/30 px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(6,182,212,0.15)] animate-fade-in">
                          Click to Reply
                        </span>
                      </div>
                    </div>
                    {parent.image_url && (
                      <div className="mt-2">
                        <Image
                          src={parent.image_url}
                          alt="comment image"
                          width={400}
                          height={300}
                          className="rounded-lg object-cover max-h-64 w-auto border border-border"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Nested Replies List (always visible, no collapsible/hide actions) */}
                {replies.length > 0 && (
                  <div className="pl-11 space-y-3.5 border-l border-white/5 ml-4 pt-1">
                    {replies.map((reply: any) => {
                      const rp = reply.users
                      return (
                        <div key={reply.id} className="flex gap-2.5 items-start text-xs">
                          <Link href={`/u/${rp?.username || ''}`}>
                            {rp?.avatar_url ? (
                              <Image
                                src={rp.avatar_url}
                                alt=""
                                width={24}
                                height={24}
                                className="w-6 h-6 rounded-full object-cover border border-border shrink-0"
                              />
                            ) : (
                              <DefaultAvatar className="w-6 h-6 shrink-0" />
                            )}
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center text-[10px] text-text-muted mb-0.5">
                              <span
                                className="font-semibold text-text-primary text-[11px] hover:text-primary transition-colors cursor-pointer"
                                onClick={() => handleReplyToUser(rp?.username || '', parent.id)}
                              >
                                {rp?.display_name || rp?.username || 'Member'}
                              </span>
                              <span>{timeAgo(reply.created_at)}</span>
                            </div>
                            <div 
                              onClick={() => handleReplyToUser(rp?.username || '', parent.id)}
                              className="text-text-secondary comment-body leading-normal comment-slate py-1.5 px-3 rounded-lg border border-white/5 relative group/comment cursor-pointer transition-all duration-200 hover:brightness-90 select-none overflow-hidden"
                            >
                              <PostContent content={reply.content} />
                              {reply.image_url && (
                                <div className="mt-2">
                                  <Image
                                    src={reply.image_url}
                                    alt="reply image"
                                    width={300}
                                    height={200}
                                    className="rounded-lg object-cover max-h-48 w-auto border border-border"
                                  />
                                </div>
                              )}

                              {/* Hover overlay with word click to reply */}
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/comment:opacity-100 transition-opacity duration-200 flex items-center justify-end pr-2.5">
                                <span className="text-[8px] text-primary font-bold tracking-widest uppercase bg-slate-950/80 border border-primary/30 px-1 py-0.5 rounded shadow-[0_0_10px_rgba(6,182,212,0.15)] animate-fade-in">
                                  Click to Reply
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
