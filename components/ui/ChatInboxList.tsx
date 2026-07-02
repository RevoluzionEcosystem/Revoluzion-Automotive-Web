'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, MessageSquare, ArrowRight, UserCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'

interface DirectConversationSummary {
  participant_id: string
  username: string
  display_name: string
  avatar_url: string
  last_message: string
  last_msg_at: string
}

export function ChatInboxList() {
  const supabase = createClient()
  const [conversations, setConversations] = useState<DirectConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        fetchDirectChatInbox(user.id)
      } else {
        setLoading(false)
      }
    })
  }, [supabase])

  async function fetchDirectChatInbox(uid: string) {
    try {
      // Find all inboxes where user is the sender or receiver
      const { data, error } = await supabase
        .from('direct_messages')
        .select('sender_id, recipient_id, message, created_at')
        .or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (!data || data.length === 0) {
        setConversations([])
        setLoading(false)
        return
      }

      // Group by the other participant
      const uniqueParticipants = new Map<string, { last_message: string; last_msg_at: string }>()
      
      data.forEach((msg) => {
        const otherId = msg.sender_id === uid ? msg.recipient_id : msg.sender_id
        if (!uniqueParticipants.has(otherId)) {
          uniqueParticipants.set(otherId, {
            last_message: msg.message,
            last_msg_at: msg.created_at,
          })
        }
      })

      // Fetch profile details for all participants
      const participantDocs: DirectConversationSummary[] = []
      for (const [pId, detail] of uniqueParticipants.entries()) {
        const { data: profile } = await supabase
          .from('users')
          .select('username, display_name, avatar_url')
          .eq('id', pId)
          .single()

        if (profile) {
          participantDocs.push({
            participant_id: pId,
            username: profile.username || 'user',
            display_name: profile.display_name || profile.username || 'User',
            avatar_url: profile.avatar_url || '',
            last_message: detail.last_message,
            last_msg_at: detail.last_msg_at,
          })
        }
      }

      setConversations(participantDocs)
    } catch {
      console.error('Inboxes could not be fully loaded.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-6 text-xs text-text-muted">Loading inbox thread summaries...</div>
  }

  if (!userId) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Mail size={14} className="text-primary" />
        <h3 className="text-xs font-black uppercase tracking-wider text-text-secondary" style={{ fontFamily: 'var(--font-orbitron)' }}>
          Direct Inboxes ({conversations.length})
        </h3>
      </div>

      {conversations.length === 0 ? (
        <div className="p-4 rounded-xl border border-slate-700/60 bg-surface/20 text-center text-text-muted text-[11px] leading-relaxed">
          Your personal DMs inbox is empty. Message a seller on their listing key detail pages to start a secure personal conversation!
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link
              key={conv.participant_id}
              href={`/chat/dm/${conv.participant_id}`}
              className="p-3 bg-gradient border border-slate-700/80 hover:border-slate-500 rounded-xl flex items-center justify-between gap-3 transition-all text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {conv.avatar_url ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-700/60 flex-shrink-0">
                    <Image src={conv.avatar_url} fill className="object-cover" alt="" />
                  </div>
                ) : (
                  <div className="w-8 h-8 border border-slate-700/60 rounded-full flex items-center justify-center bg-surface overflow-hidden flex-shrink-0">
                    <DefaultAvatar className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-bold text-white truncate max-w-[120px]">{conv.display_name}</div>
                  <p className="text-[10px] text-text-muted truncate max-w-[140px] mt-0.5">{conv.last_message}</p>
                </div>
              </div>
              <ArrowRight size={12} className="text-primary opacity-50 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
