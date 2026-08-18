'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { timeAgo } from '@/lib/utils'
import {
  Heart,
  MessageCircle,
  X,
  Send,
  MoreVertical,
  Pencil,
  Trash2,
  Flag,
} from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { PostContent } from '@/components/ui/PostContent'
import { LinkPreview } from '@/components/ui/LinkPreview'
import { MentionTextarea } from '@/components/ui/MentionTextarea'
import { SafeImage } from '@/components/ui/SafeImage'
import { toast } from 'sonner'
import Link from 'next/link'
import { pickUser, wasEdited, type FeedUser, type PostCardData, type TopComment } from './types'

interface InlineCommentRow {
  id: string
  post_id: string
  parent_id: string | null
  content: string
  created_at: string
  users: FeedUser | FeedUser[] | null
}

interface PostCardProps {
  post: PostCardData
  currentUserId: string | null
  topComment?: TopComment | null
  initialLiked?: boolean
}

export function PostCard({ post, currentUserId, topComment, initialLiked = false }: PostCardProps) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const profile = post.user

  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(post.likes_count ?? 0)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false)
  const [quickCommentText, setQuickCommentText] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [editSaving, setEditSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportSending, setReportSending] = useState(false)

  const isOwner = currentUserId != null && currentUserId === post.user_id

  useEffect(() => {
    setLiked(initialLiked)
  }, [initialLiked])

  useEffect(() => {
    setLikeCount(post.likes_count ?? 0)
  }, [post.likes_count])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  // Inline comments for this post (only fetched once expanded)
  const { data: inlineComments = [], refetch: refetchInlineComments } = useQuery<InlineCommentRow[]>({
    queryKey: ['post-inline-comments', post.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('post_comments')
        .select('*, users!post_comments_user_id_fkey(username, display_name, avatar_url)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })
      return (data as InlineCommentRow[]) ?? []
    },
    enabled: isCommentsExpanded,
  })

  const { parentComments, childComments } = useMemo(() => {
    const parents = inlineComments.filter((c) => !c.parent_id)
    const children = inlineComments.filter((c) => c.parent_id)
    return { parentComments: parents, childComments: children }
  }, [inlineComments])

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
    onMutate: () => {
      const prev = { liked, likeCount }
      setLiked((l) => !l)
      setLikeCount((c) => (liked ? c - 1 : c + 1))
      return prev
    },
    onError: (_err, _vars, prev) => {
      if (prev) {
        setLiked(prev.liked)
        setLikeCount(prev.likeCount)
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  })

  async function handleQuickCommentSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!quickCommentText.trim() || !currentUserId) return
    setPostingComment(true)
    const textToInsert = quickCommentText.trim()

    const { error } = await supabase.from('post_comments').insert({
      post_id: post.id,
      user_id: currentUserId,
      content: textToInsert,
      parent_id: replyingToCommentId,
    })

    if (error) {
      toast.error('Could not post comment', { description: error.message })
    } else {
      setQuickCommentText('')
      setReplyingToCommentId(null)
      refetchInlineComments()
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast.success('Submitted successfully! 💬')
    }
    setPostingComment(false)
  }

  function handleReplyToUser(username: string | null, parentCommentId: string) {
    if (!currentUserId) {
      toast.error('Sign in required 🔒')
      return
    }
    setReplyingToCommentId(parentCommentId)
    setQuickCommentText(`@${username ?? ''} `)
    const el = document.getElementById(`quick-input-${post.id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  async function handleEdit() {
    const trimmed = editContent.trim()
    if (!trimmed || trimmed === post.content) {
      setEditOpen(false)
      return
    }
    setEditSaving(true)
    const { error } = await supabase.from('posts').update({ content: trimmed }).eq('id', post.id)
    setEditSaving(false)
    if (error) {
      toast.error('Update failed', { description: 'Could not save your changes. Please try again.' })
      return
    }
    toast.success('Post updated ✏️', { description: 'Your changes have been saved.' })
    setEditOpen(false)
    queryClient.invalidateQueries({ queryKey: ['aggregated-feed'] })
  }

  async function handleReport() {
    if (!reportReason.trim()) {
      toast.error('Select a reason', { description: 'Please choose a report reason before submitting.' })
      return
    }
    if (!currentUserId) {
      toast.error('Sign in to report', { description: 'You must be signed in to report posts.' })
      return
    }
    setReportSending(true)
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
    if (error) {
      toast.error('Delete failed', { description: 'Could not delete this post. Please try again.' })
      return
    }
    toast.success('Post deleted', { description: 'The post has been permanently removed.' })
    setDeleted(true)
    setDeleteOpen(false)
    queryClient.invalidateQueries({ queryKey: ['aggregated-feed'] })
  }

  if (deleted) return null

  return (
    <>
      <article className="rounded-xl border border-white/6 bg-gradient p-4 sm:p-5 mb-4 shadow-xl transition-all duration-300 hover:border-white/10 hover:-translate-y-0.5 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <UserAvatar
            src={profile?.avatar_url}
            name={profile?.display_name || 'User'}
            className="w-10 h-10"
            href={`/u/${profile?.username || post.user_id}`}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap leading-tight">
              <Link
                href={`/u/${profile?.username || post.user_id}`}
                className="font-semibold text-text-primary text-sm hover:text-primary transition-colors truncate"
              >
                {profile?.display_name || profile?.username || 'Member'}
              </Link>
              {profile?.is_verified && <span className="badge-primary py-0 text-[10px]">Verified</span>}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-xs text-text-muted">
              {profile?.username && <span className="truncate">@{profile.username}</span>}
              <span aria-hidden>·</span>
              <span>{timeAgo(post.created_at)}</span>
              {wasEdited(post) && <span className="text-text-muted/70">(edited {timeAgo(post.updated_at!)})</span>}
            </div>
          </div>

          {(isOwner || (currentUserId && currentUserId !== post.user_id)) && (
            <div className="relative shrink-0" ref={menuRef}>
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
                        onClick={() => {
                          setMenuOpen(false)
                          setEditContent(post.content)
                          setEditOpen(true)
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-variant transition-colors"
                      >
                        <Pencil size={14} /> Edit Post
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false)
                          setDeleteOpen(true)
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-error hover:bg-error/10 transition-colors"
                      >
                        <Trash2 size={14} /> Delete Post
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        setReportOpen(true)
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-error hover:bg-error/10 transition-colors"
                    >
                      <Flag size={14} /> Report Post
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <PostContent content={post.content} />
        <LinkPreview content={post.content} />

        {post.image_url && (
          <div className="mb-3 mt-1 rounded-lg overflow-hidden border border-border w-full h-64 sm:h-96 relative bg-surface">
            <SafeImage src={post.image_url} alt="Post image" fill className="object-cover" />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-5 pt-3 border-t border-border/40">
          <button
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className={`flex items-center gap-1.5 transition-colors text-sm disabled:opacity-60 ${
              liked ? 'text-error' : 'text-text-muted hover:text-error'
            }`}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <Heart
              size={16}
              className={`transition-all ${liked ? 'animate-heart-pop' : ''}`}
              style={liked ? { fill: 'currentColor' } : undefined}
            />
            <span className="tabular-nums">{likeCount}</span>
          </button>
          <button
            onClick={() => setIsCommentsExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-text-muted hover:text-primary transition-colors text-sm cursor-pointer"
          >
            <MessageCircle size={16} />
            <span className="tabular-nums">{post.comments_count}</span>
          </button>
        </div>

        {/* Inline comments */}
        {isCommentsExpanded && (
          <div className="mt-4 pt-4 border-t border-border/40 space-y-4">
            <div className="space-y-4">
              {parentComments.map((parent) => {
                const replies = childComments.filter((c) => c.parent_id === parent.id)
                const pu = pickUser(parent.users)
                return (
                  <div key={parent.id} className="space-y-2 border-b border-border/10 pb-3 last:border-0 last:pb-0">
                    {/* Parent */}
                    <div className="flex gap-2.5 items-start text-xs">
                      <UserAvatar
                        src={pu?.avatar_url}
                        name={pu?.display_name || pu?.username || ''}
                        className="w-7 h-7"
                        href={pu?.username ? `/u/${pu.username}` : null}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center text-[11px] text-text-muted mb-0.5 gap-2">
                          <button
                            onClick={() => handleReplyToUser(pu?.username ?? null, parent.id)}
                            className="font-semibold text-text-primary text-xs hover:text-primary transition-colors truncate text-left"
                          >
                            {pu?.display_name || pu?.username || 'Member'}
                          </button>
                          <span className="shrink-0">{timeAgo(parent.created_at)}</span>
                        </div>
                        <button
                          onClick={() => handleReplyToUser(pu?.username ?? null, parent.id)}
                          className="text-left w-full comment-slate py-1.5 px-3 rounded-lg relative group/comment cursor-pointer transition-all duration-200 hover:brightness-90"
                        >
                          <div className="comment-body text-text-secondary">
                            <PostContent content={parent.content} />
                          </div>
                          <span className="absolute inset-0 flex items-center justify-end pr-3 opacity-0 group-hover/comment:opacity-100 transition-opacity pointer-events-none">
                            <span className="text-[9px] text-primary font-bold tracking-widest uppercase bg-slate-950/80 border border-primary/30 px-1.5 py-0.5 rounded">
                              Reply
                            </span>
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Replies */}
                    {replies.length > 0 && (
                      <div className="pl-9 space-y-2.5 border-l border-white/5 ml-3.5 pt-1">
                        {replies.map((reply) => {
                          const ru = pickUser(reply.users)
                          return (
                            <div key={reply.id} className="flex gap-2.5 items-start text-xs">
                              <UserAvatar
                                src={ru?.avatar_url}
                                name={ru?.display_name || ru?.username || ''}
                                className="w-6 h-6"
                                href={ru?.username ? `/u/${ru.username}` : null}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center text-[10px] text-text-muted mb-0.5 gap-2">
                                  <button
                                    onClick={() => handleReplyToUser(ru?.username ?? null, parent.id)}
                                    className="font-semibold text-text-primary text-[11px] hover:text-primary transition-colors truncate text-left"
                                  >
                                    {ru?.display_name || ru?.username || 'Member'}
                                  </button>
                                  <span className="shrink-0">{timeAgo(reply.created_at)}</span>
                                </div>
                                <button
                                  onClick={() => handleReplyToUser(ru?.username ?? null, parent.id)}
                                  className="text-left w-full comment-slate py-1.5 px-3 rounded-lg relative group/comment cursor-pointer transition-all duration-200 hover:brightness-90"
                                >
                                  <div className="comment-body text-text-secondary">
                                    <PostContent content={reply.content} />
                                  </div>
                                  <span className="absolute inset-0 flex items-center justify-end pr-2.5 opacity-0 group-hover/comment:opacity-100 transition-opacity pointer-events-none">
                                    <span className="text-[8px] text-primary font-bold tracking-widest uppercase bg-slate-950/80 border border-primary/30 px-1 py-0.5 rounded">
                                      Reply
                                    </span>
                                  </span>
                                </button>
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

            {/* Quick comment */}
            {currentUserId ? (
              <form onSubmit={handleQuickCommentSubmit} id={`quick-input-${post.id}`} className="flex flex-col gap-2 pt-2 border-t border-white/5">
                {replyingToCommentId && (
                  <div className="flex items-center justify-between bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg text-xs text-primary">
                    <span className="font-medium">Replying to a comment…</span>
                    <button type="button" onClick={() => setReplyingToCommentId(null)} className="text-text-muted hover:text-white transition-colors" aria-label="Cancel reply">
                      <X size={12} />
                    </button>
                  </div>
                )}
                <div className="flex gap-2 items-end">
                  <div className="flex-1 bg-black border border-white/10 rounded-xl relative overflow-hidden">
                    <MentionTextarea
                      value={quickCommentText}
                      onChange={setQuickCommentText}
                      placeholder={replyingToCommentId ? 'Write a reply…' : 'Write a comment…'}
                      className="w-full bg-black text-white text-sm resize-none p-3 outline-none min-h-11"
                      maxLength={500}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={postingComment || !quickCommentText.trim()}
                    className="btn-primary flex items-center justify-center p-3 rounded-xl h-11 transition-all shrink-0 cursor-pointer active:scale-95"
                    aria-label="Send comment"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-text-muted text-center py-2.5">
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>{' '}
                to join the discussion
              </p>
            )}
          </div>
        )}

        {/* Top comment preview when folded */}
        {!isCommentsExpanded && topComment && (
          <button
            onClick={() => setIsCommentsExpanded(true)}
            className="mt-3 pt-3 border-t border-border/30 flex items-start gap-2 w-full cursor-pointer hover:bg-white/3 p-1 rounded-lg transition-colors text-left"
          >
            <UserAvatar
              src={topComment.users?.avatar_url}
              name={topComment.users?.display_name || ''}
              className="w-6 h-6 shrink-0 mt-0.5"
            />
            <div className="flex-1 min-w-0 bg-surface-variant/40 rounded px-2.5 py-1.5 border border-white/5">
              <span className="block font-medium text-text-primary text-[11px] mb-0.5">
                {topComment.users?.display_name || topComment.users?.username || 'Member'}
              </span>
              <div className="text-text-secondary text-xs line-clamp-2">
                <PostContent content={topComment.content} />
              </div>
            </div>
          </button>
        )}
      </article>

      {/* Edit modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
              <h2 className="font-semibold text-text-primary" style={{ fontFamily: 'var(--font-orbitron)' }}>
                Edit Post
              </h2>
              <button onClick={() => setEditOpen(false)} className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-variant transition-colors" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 bg-black">
              <MentionTextarea
                value={editContent}
                onChange={setEditContent}
                placeholder="What's on your mind?"
                className="input resize-none text-sm min-h-25 w-full bg-black text-white border border-white/10"
                maxLength={20000}
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-text-muted text-xs tabular-nums">{editContent.length}/20000</span>
                <div className="flex gap-2">
                  <button onClick={() => setEditOpen(false)} className="px-4 py-1.5 rounded-lg text-sm text-text-muted border border-border hover:bg-surface-variant transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleEdit} disabled={editSaving || !editContent.trim()} className="btn-primary py-1.5 px-4 text-sm">
                    {editSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm shadow-xl p-6 text-center">
            <Trash2 size={32} className="mx-auto mb-3 text-error opacity-80" />
            <h2 className="font-semibold text-text-primary mb-1" style={{ fontFamily: 'var(--font-orbitron)' }}>
              Delete Post?
            </h2>
            <p className="text-text-muted text-sm mb-5">This cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteOpen(false)} className="px-5 py-2 rounded-lg text-sm border border-border text-text-muted hover:bg-surface-variant transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} className="px-5 py-2 rounded-lg text-sm bg-error text-white hover:bg-error/80 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text-primary" style={{ fontFamily: 'var(--font-orbitron)' }}>
                Report Post
              </h2>
              <button onClick={() => { setReportOpen(false); setReportReason('') }} className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-variant transition-colors" aria-label="Close">
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
                    reportReason === r ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary hover:bg-surface-variant'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setReportOpen(false); setReportReason('') }} className="flex-1 px-4 py-2 rounded-lg text-sm border border-border text-text-muted hover:bg-surface-variant transition-colors">
                Cancel
              </button>
              <button onClick={handleReport} disabled={reportSending || !reportReason} className="flex-1 px-4 py-2 rounded-lg text-sm bg-error text-white hover:bg-error/80 transition-colors disabled:opacity-50">
                {reportSending ? 'Sending…' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
