'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, Hash, Users } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import Image from 'next/image'
import { toast } from 'sonner'
import type { ChatMessage } from '@/lib/supabase/types'

function dateSeparatorLabel(iso: string): string {
  const d   = new Date(iso)
  const now = new Date()
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86_400_000)
  const msg       = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (msg.getTime() === today.getTime())     return 'Today'
  if (msg.getTime() === yesterday.getTime()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() &&
         da.getMonth()    === db.getMonth()    &&
         da.getDate()     === db.getDate()
}

// ── Anti-spam: max 10 messages in any 60-second window ────────────────────────
const SPAM_WINDOW_MS  = 60_000
const SPAM_MAX_MSGS   = 10
const msgTimestamps: number[] = []

function checkSpam(): string | null {
  const now = Date.now()
  // Remove timestamps older than the window
  while (msgTimestamps.length > 0 && now - msgTimestamps[0] > SPAM_WINDOW_MS) {
    msgTimestamps.shift()
  }
  if (msgTimestamps.length >= SPAM_MAX_MSGS) {
    const wait = Math.ceil((SPAM_WINDOW_MS - (now - msgTimestamps[0])) / 1000)
    return `Slow down! Wait ${wait}s before sending again.`
  }
  msgTimestamps.push(now)
  return null
}

export default function ChatPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [onlineCount, setOnlineCount] = useState(1)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100)
      if (error) throw error
      return data as ChatMessage[]
    },
  })

  // Realtime messages
  useEffect(() => {
    const channel = supabase
      .channel('chat-room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        queryClient.setQueryData(['chat-messages'], (old: ChatMessage[] = []) => [
          ...old,
          payload.new as ChatMessage,
        ])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, queryClient])

  // Presence — track online users in this chat room
  useEffect(() => {
    if (!user) return
    const presence = supabase.channel('chat-presence', {
      config: { presence: { key: user.id } },
    })
    presence
      .on('presence', { event: 'sync' }, () => {
        const state = presence.presenceState()
        setOnlineCount(Object.keys(state).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presence.track({ user_id: user.id, online_at: new Date().toISOString() })
        }
      })

    return () => { supabase.removeChannel(presence) }
  }, [supabase, user])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed || !user) {
      if (!user) toast.error('Sign in required', { description: 'You need to be signed in to send messages.' })
      return
    }

    const spamError = checkSpam()
    if (spamError) {
      toast.warning('Slow down! 🛑', { description: spamError })
      return
    }

    setSending(true)

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url, username')
      .eq('id', user.id)
      .single()

    const { error } = await supabase.from('chat_messages').insert({
      user_id: user.id,
      message: trimmed,
      display_name: profile?.display_name || profile?.username || user.email?.split('@')[0] || 'Member',
      avatar_url: profile?.avatar_url || null,
    })

    if (error) {
      toast.error('Message not sent', { description: 'Something went wrong. Please try again.' })
    } else {
      setMessage('')
    }
    setSending(false)
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Hash size={16} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-text-primary text-sm">Community Global Chat</div>
          <div className="flex items-center gap-3 text-text-muted text-xs">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              <Users size={11} />
              {onlineCount} online
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            <Hash size={32} className="mx-auto mb-3 opacity-30" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const prev = messages[i - 1]
          const showDate = !prev || !isSameDay(prev.created_at, msg.created_at)
          const showAvatar = !prev || prev.user_id !== msg.user_id || showDate
          return (
            <div key={msg.id}>
              {/* ── Date divider ── */}
              {showDate && (
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-text-muted text-[10px] font-medium px-1 shrink-0">
                    {dateSeparatorLabel(msg.created_at)}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
              {/* ── Message row ── */}
              <div className={`flex items-start gap-2.5 mb-3 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                {/* Avatar — shown once per sender group */}
                <div className="w-8 shrink-0">
                  {showAvatar ? (
                    msg.avatar_url ? (
                      <Image src={msg.avatar_url} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover border border-border" />
                    ) : (
                      <DefaultAvatar className="w-8 h-8" />
                    )
                  ) : null}
                </div>
                <div className={`max-w-xs lg:max-w-md flex flex-col ${msg.user_id === user?.id ? 'items-end' : 'items-start'}`}>
                  {/* Name · time-ago */}
                  <span className="text-text-muted text-[10px] mb-1 px-0.5">
                    {msg.display_name} · {timeAgo(msg.created_at)}
                  </span>
                  <div className={`px-3 py-2 text-sm leading-relaxed ${
                    msg.user_id === user?.id
                      ? 'bg-primary text-black rounded-tl rounded-tr rounded-bl rounded-br-sm'
                      : 'bg-surface-variant text-text-primary rounded-tl rounded-tr rounded-br rounded-tl-sm border border-border'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-4 py-3 border-t border-border bg-surface">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={user ? 'Type a message...' : 'Sign in to chat'}
            disabled={!user}
            maxLength={500}
            className="input flex-1 bg-background text-sm"
          />
          <button
            type="submit"
            disabled={!user || !message.trim() || sending}
            className="btn-primary px-4 flex items-center gap-2 shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  )
}
