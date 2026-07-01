'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, Loader2 } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { PostContent } from '@/components/ui/PostContent'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'

interface Props {
  eventId: string
}

export default function EventCommentSection({ eventId }: Props) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['event-comments', eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('event_comments')
        .select('*, users!event_comments_user_id_fkey(username, display_name, avatar_url)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
        .limit(100)
      return (data ?? []) as any[]
    },
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!comment.trim()) return

    if (!user) {
      toast.error('Sign in required 🔒', { description: 'Please log in to leave a comment on this event.' })
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('event_comments').insert({
        event_id: eventId,
        user_id: user.id,
        content: comment.trim(),
      })
      if (error) {
        toast.error('Comment not posted', { description: error.message })
        return
      }
      setComment('')
      toast.success('Comment posted! 💬', { description: 'Your comment has been added to the discussion.' })
      
      // Invalidate queries so comment counts and contents refresh instantly
      queryClient.invalidateQueries({ queryKey: ['event-comments', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event-likes-count', eventId] })
    } catch (err: any) {
      toast.error('Comment error', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card p-5 bg-linear-to-b from-[#181d29] to-[#0d1017] border-white/5 relative space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h3 className="font-bold text-xs uppercase tracking-widest text-text-primary" style={{ fontFamily: 'var(--font-orbitron)' }}>
          Discussion ({comments.length})
        </h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin h-6 w-6 text-primary" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-xs text-text-muted">
          No comments yet. Start the conversation below!
        </div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
          {comments.map((c) => {
            const profile = c.users
            return (
              <div key={c.id} className="flex gap-3 items-start text-xs border-b border-white/[0.03] pb-3 last:border-0 last:pb-0">
                <Link href={`/u/${profile?.username || ''}`} className="shrink-0">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt=""
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <DefaultAvatar className="w-7 h-7" />
                  )}
                </Link>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link href={`/u/${profile?.username || ''}`} className="font-bold text-text-primary hover:underline">
                      {profile?.display_name || profile?.username || 'Revoluzion Driver'}
                    </Link>
                    <span className="text-[10px] text-text-muted">
                      · {timeAgo(c.created_at)}
                    </span>
                  </div>
                  <div className="text-text-secondary leading-relaxed break-words">
                    <PostContent content={c.content} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Input section */}
      <form onSubmit={handleSubmit} className="flex items-end gap-3 pt-3 border-t border-white/5">
        <div className="flex-1">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={user ? "Write a comment..." : "Please log in to write a comment."}
            disabled={!user || submitting}
            rows={2}
            className="w-full bg-[#0A0A0A] border border-white/5 focus:border-primary/50 rounded-xl px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-hidden resize-none transition-all disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={!comment.trim() || submitting || !user}
          className="bg-primary hover:bg-primary-light text-black font-semibold h-9 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:hover:bg-primary shrink-0"
        >
          {submitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              <Send size={12} />
              <span>Post</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
