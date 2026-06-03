'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, ArrowLeft, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { timeAgo } from '@/lib/utils'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useParams } from 'next/navigation'

interface DMMessage {
  id: string
  sender_id: string
  recipient_id: string
  message: string
  created_at: string
  display_name?: string
  avatar_url?: string
}

export default function DMPage() {
  const params = useParams()
  const recipientId = params.id as string
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [text, setText] = useState('')
  const [recipientProfile, setRecipientProfile] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user ?? null))
  }, [supabase])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', recipientId)
      .single()
      .then(({ data }) => setRecipientProfile(data))
  }, [supabase, recipientId])

  // Fetch DMs between current user and recipient
  const { data: messages = [] } = useQuery({
    queryKey: ['dm', recipientId],
    queryFn: async () => {
      if (!user) return []
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true })
        .limit(100)
      return (data ?? []) as DMMessage[]
    },
    enabled: !!user,
    staleTime: 0,
  })

  // Realtime
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`dm-${recipientId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (payload) => {
        const msg = payload.new as DMMessage
        if (
          (msg.sender_id === user.id && msg.recipient_id === recipientId) ||
          (msg.sender_id === recipientId && msg.recipient_id === user.id)
        ) {
          queryClient.setQueryData(['dm', recipientId], (prev: DMMessage[]) => [...(prev ?? []), msg])
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, recipientId, supabase, queryClient])

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('direct_messages').insert({
        sender_id: user.id,
        recipient_id: recipientId,
        message,
      })
      if (error) throw error
    },
    onSuccess: () => setText(''),
    onError: () => {
      // direct_messages table may not exist yet — show graceful error
      alert('Direct messages are not yet available.')
    },
  })

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    sendMutation.mutate(trimmed)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface shrink-0">
        <Link href="/chat" className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-variant transition-colors">
          <ArrowLeft size={18} />
        </Link>
        {recipientProfile?.avatar_url ? (
          <Image
            src={recipientProfile.avatar_url}
            alt={recipientProfile.display_name ?? ''}
            width={36}
            height={36}
            className="w-9 h-9 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-surface-variant border border-border flex items-center justify-center">
            <User size={16} className="text-text-muted" />
          </div>
        )}
        <div>
          <div className="font-semibold text-text-primary text-sm">
            {recipientProfile?.display_name ?? recipientProfile?.username ?? 'Loading...'}
          </div>
          {recipientProfile?.username && (
            <div className="text-text-muted text-xs">@{recipientProfile.username}</div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-text-muted text-sm">
            <p>No messages yet</p>
            <p className="text-xs mt-1">Start a conversation</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === user?.id
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
              {!isOwn && (
                <div className="w-7 h-7 rounded-full bg-surface-variant border border-border flex items-center justify-center shrink-0">
                  {recipientProfile?.avatar_url ? (
                    <Image src={recipientProfile.avatar_url} alt="" width={28} height={28} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User size={12} className="text-text-muted" />
                  )}
                </div>
              )}
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isOwn
                    ? 'bg-primary text-black rounded-br-sm'
                    : 'bg-surface-variant text-text-primary rounded-bl-sm'
                }`}
              >
                <p>{msg.message}</p>
                <p className={`text-[10px] mt-1 ${isOwn ? 'text-black/60' : 'text-text-muted'}`}>
                  {timeAgo(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-4 py-3 border-t border-border bg-surface flex gap-2 shrink-0">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="input flex-1 text-sm py-2.5"
          disabled={!user}
        />
        <button
          type="submit"
          disabled={!text.trim() || sendMutation.isPending || !user}
          className="btn-primary px-4 py-2.5 flex items-center gap-1.5 text-sm"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  )
}
