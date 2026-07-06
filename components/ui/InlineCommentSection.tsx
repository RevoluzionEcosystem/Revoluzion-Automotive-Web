'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Send, X, Loader2 } from 'lucide-react'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { PostContent } from '@/components/ui/PostContent'
import { timeAgo } from '@/lib/utils'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'

interface InlineCommentSectionProps {
  itemId: string
  feedType: 'car' | 'build' | 'event' | 'listing' | 'service'
  currentUserId: string | null
}

const TABLE_MAPPINGS = {
  car: { table: 'car_comments', idField: 'car_id', fkey: 'car_comments_user_id_fkey' },
  build: { table: 'build_comments', idField: 'build_id', fkey: 'fk_build_comments_user_id_to_users' },
  event: { table: 'event_comments', idField: 'event_id', fkey: 'event_comments_user_id_fkey' },
  listing: { table: 'marketplace_comments', idField: 'listing_id', fkey: 'marketplace_comments_user_id_fkey' },
  service: { table: 'service_comments', idField: 'service_id', fkey: 'service_comments_user_id_fkey' }
} as const

export function InlineCommentSection({ itemId, feedType, currentUserId }: InlineCommentSectionProps) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const mapping = TABLE_MAPPINGS[feedType]

  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyingToId, setReplyingToId] = useState<string | null>(null)

  const { data: comments = [], isLoading, refetch } = useQuery({
    queryKey: ['feed-inline-comments', feedType, itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(mapping.table)
        .select(`*, users!${mapping.fkey}(username, display_name, avatar_url)`)
        .eq(mapping.idField, itemId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    }
  })

  const parentComments = comments.filter((c: any) => !c.parent_id)
  const childComments = comments.filter((c: any) => c.parent_id)

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    if (!currentUserId) {
      toast.error('Sign in required 🔒', { description: 'Please sign in to leave a comment.' })
      return
    }

    setSubmitting(true)
    try {
      const insertObj: any = {
        [mapping.idField]: itemId,
        user_id: currentUserId,
        content: commentText.trim(),
        parent_id: replyingToId
      }

      const { error } = await supabase.from(mapping.table).insert(insertObj)
      if (error) throw error

      setCommentText('')
      setReplyingToId(null)
      toast.success('Comment posted successfully! 💬')
      refetch()
      queryClient.invalidateQueries({ queryKey: ['aggregated-feed'] })
    } catch (err: any) {
      toast.error('Failed to post comment', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReplyTo = (username: string, parentId: string) => {
    if (!currentUserId) {
      toast.error('Sign in required 🔒')
      return
    }
    setReplyingToId(parentId)
    setCommentText(`@${username} `)
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
      <div className="flex items-center gap-2 text-xs font-bold font-mono tracking-wider text-text-secondary uppercase select-none">
        <MessageSquare size={13} className="text-primary" />
        Discussions ({comments.length})
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="animate-spin h-5 w-5 text-primary" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-[11px] text-text-disabled py-2">No discussions yet. Start the conversation below!</p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {parentComments.map((parent: any) => {
            const replies = childComments.filter((c: any) => c.parent_id === parent.id)
            const pu = parent.users

            return (
              <div key={parent.id} className="space-y-2 border-b border-white/[0.02] pb-3 last:border-0 last:pb-0 text-left">
                {/* Parent comment node */}
                <div className="flex gap-2.5 items-start text-xs">
                  <Link href={`/u/${pu?.username || ''}`}>
                    {pu?.avatar_url ? (
                      <Image
                        src={pu.avatar_url}
                        alt=""
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <DefaultAvatar className="w-6 h-6" />
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-[10px] text-text-muted mb-0.5 font-sans">
                      <span 
                        className="font-bold text-text-primary hover:text-primary transition-colors cursor-pointer"
                        onClick={() => handleReplyTo(pu?.username || 'member', parent.id)}
                      >
                        {pu?.display_name || pu?.username || 'Member'}
                      </span>
                      <span>{timeAgo(parent.created_at)}</span>
                    </div>

                    <div 
                      onClick={() => handleReplyTo(pu?.username || 'member', parent.id)}
                      className="text-text-secondary comment-body leading-normal comment-slate py-1 px-2.5 rounded-lg border border-white/5 relative group/comment cursor-pointer transition-all duration-200 hover:brightness-90 select-none overflow-hidden text-[11px]"
                    >
                      <PostContent content={parent.content} />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/comment:opacity-100 transition-opacity duration-200 flex items-center justify-end pr-2.5">
                        <span className="text-[8px] text-primary font-bold tracking-widest uppercase bg-slate-950/80 border border-primary/30 px-1 py-0.5 rounded shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                          Reply
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recursive Nested Replies List */}
                {replies.length > 0 && (
                  <div className="pl-8 space-y-2.5 border-l border-white/5 ml-3 pt-1">
                    {replies.map((reply: any) => {
                      const ru = reply.users
                      return (
                        <div key={reply.id} className="flex gap-2 items-start text-[11px]">
                          <Link href={`/u/${ru?.username || ''}`}>
                            {ru?.avatar_url ? (
                              <Image
                                src={ru.avatar_url}
                                alt=""
                                width={20}
                                height={20}
                                className="w-5 h-5 rounded-full object-cover border border-border"
                              />
                            ) : (
                              <DefaultAvatar className="w-5 h-5" />
                            )}
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center text-[9px] text-text-muted mb-0.5 font-sans">
                              <span 
                                className="font-bold text-text-primary hover:text-primary transition-colors cursor-pointer"
                                onClick={() => handleReplyTo(ru?.username || 'member', parent.id)}
                              >
                                {ru?.display_name || ru?.username || 'Member'}
                              </span>
                              <span>{timeAgo(reply.created_at)}</span>
                            </div>
                            <div 
                              onClick={() => handleReplyTo(ru?.username || 'member', parent.id)}
                              className="text-text-secondary comment-body leading-normal comment-slate py-1 px-2.5 rounded-lg border border-white/5 relative group/comment cursor-pointer transition-all duration-200 hover:brightness-90 select-none overflow-hidden text-[10.5px]"
                            >
                              <PostContent content={reply.content} />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/comment:opacity-100 transition-opacity duration-200 flex items-center justify-end pr-2.5">
                                <span className="text-[8px] text-primary font-bold tracking-widest uppercase bg-slate-950/80 border border-primary/30 px-1 py-0.5 rounded shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                                  Reply
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

      {/* Input commenter box */}
      {currentUserId ? (
        <form onSubmit={handleCommentSubmit} className="flex flex-col gap-2 pt-2 border-t border-white/5">
          {replyingToId && (
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg text-[10px] text-primary">
              <span className="font-semibold uppercase tracking-wider font-mono">Replying to thread...</span>
              <button
                type="button"
                onClick={() => setReplyingToId(null)}
                className="text-text-muted hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={replyingToId ? "Write a reply thread..." : "Write a public comment..."}
              maxLength={400}
              className="flex-1 h-9 bg-black border border-white/10 rounded-xl px-3 text-xs text-white placeholder-text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="btn-primary flex items-center justify-center h-9 w-9 rounded-xl transition-all shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Send size={13} />
            </button>
          </div>
        </form>
      ) : (
        <p className="text-[10px] text-text-muted text-center py-2 border-t border-white/5">
          <Link href="/login" className="text-primary hover:underline">Sign in</Link> to join the discussion
        </p>
      )}
    </div>
  )
}