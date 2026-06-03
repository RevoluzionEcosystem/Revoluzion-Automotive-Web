'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, Hash } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import Image from 'next/image'
import toast from 'react-hot-toast'
import type { ChatMessage } from '@/lib/supabase/types'

export default function ChatPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
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

  // Realtime
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

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || !user) {
      if (!user) toast.error('Sign in to chat')
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
      message: message.trim(),
      display_name: profile?.display_name || profile?.username || user.email?.split('@')[0] || 'Member',
      avatar_url: profile?.avatar_url || null,
    })

    if (error) {
      toast.error('Failed to send message')
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
        <div>
          <div className="font-semibold text-text-primary text-sm">General Chat</div>
          <div className="text-text-muted text-xs">Community room · {messages.length} messages</div>
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
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-3 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
            {msg.avatar_url ? (
              <Image src={msg.avatar_url} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover border border-border shrink-0" />
            ) : (
              <DefaultAvatar className="w-8 h-8 shrink-0" />
            )}
            <div className={`max-w-xs lg:max-w-md ${msg.user_id === user?.id ? 'items-end' : 'items-start'} flex flex-col`}>
              <span className="text-text-muted text-xs mb-1">{msg.display_name} · {timeAgo(msg.created_at)}</span>
              <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                msg.user_id === user?.id
                  ? 'bg-primary text-black rounded-tr-sm'
                  : 'bg-surface-variant text-text-primary rounded-tl-sm border border-border'
              }`}>
                {msg.message}
              </div>
            </div>
          </div>
        ))}
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
