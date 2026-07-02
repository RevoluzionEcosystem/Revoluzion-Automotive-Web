'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, ArrowLeft, Edit2, Check, X } from 'lucide-react'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import Image from 'next/image'
import Link from 'next/link'
import { timeAgo } from '@/lib/utils'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useParams, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

interface DMMessage {
  id: string
  sender_id: string
  recipient_id: string
  message: string
  created_at: string
  updated_at?: string | null
  display_name?: string
  avatar_url?: string
}

export default function DMPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const recipientId = params.id as string
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [text, setText] = useState('')
  const [recipientProfile, setRecipientProfile] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Edit State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user ?? null))
  }, [supabase])

  useEffect(() => {
    const preset = searchParams.get('preset')
    if (preset) {
      setText(preset)
    }
  }, [searchParams])

  useEffect(() => {
    supabase
      .from('users')
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
          queryClient.setQueryData(['dm', recipientId], (prev: DMMessage[] | undefined) => {
            const current = prev ?? []
            if (current.some(m => m.id === msg.id)) {
              return current
            }
            return [...current, msg]
          })
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'direct_messages' }, (payload) => {
        const msg = payload.new as DMMessage
        if (
          (msg.sender_id === user.id && msg.recipient_id === recipientId) ||
          (msg.sender_id === recipientId && msg.recipient_id === user.id)
        ) {
          queryClient.setQueryData(['dm', recipientId], (prev: DMMessage[] | undefined) => 
            (prev ?? []).map(m => m.id === msg.id ? { ...m, ...msg } : m)
          )
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

  // Edit Message
  const handleUpdateMessage = async (msgId: string) => {
    const trimmed = editText.trim()
    if (!trimmed) return

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .update({
          message: trimmed,
          updated_at: new Date().toISOString()
        })
        .eq('id', msgId)
        .select()
        .single()

      if (error) throw error

      queryClient.setQueryData(['dm', recipientId], (prev: DMMessage[] | undefined) => 
        (prev ?? []).map(m => m.id === msgId ? { ...m, ...data } : m)
      )
      setEditingMessageId(null)
      setEditText('')
      toast.success('Message updated!')
    } catch (err: any) {
      toast.error('Failed to update message', { description: err.message })
    }
  }

  if (user && user.id === recipientId) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] p-6 text-center text-text-muted">
        <h2 className="text-lg font-black text-rose-500 mb-2 uppercase tracking-widest" style={{ fontFamily: 'var(--font-orbitron)', letterSpacing: '0.1em' }}>
          Self Messaging Blocked
        </h2>
        <p className="text-xs max-w-sm leading-relaxed mb-6">
          You cannot direct message yourself on Revoluzion. Please select a separate verified user profile or marketplace item to start a safe conversation.
        </p>
        <Link
          href="/chat/dm/inbox"
          className="h-9 px-4 rounded-xl bg-primary text-black font-extrabold uppercase text-[10px] tracking-wider hover:opacity-90 inline-flex items-center justify-center transition-all"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          Back to DM Inbox
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface shrink-0">
        <Link href="/chat/dm/inbox" className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-variant transition-colors">
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
          <DefaultAvatar className="w-9 h-9" />
        )}
        <div>
          <h1 className="font-semibold text-text-primary text-sm">
            {recipientProfile?.display_name ?? recipientProfile?.username ?? 'Loading...'}
          </h1>
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
                recipientProfile?.avatar_url ? (
                  <Image src={recipientProfile.avatar_url} alt="" width={28} height={28} className="w-7 h-7 rounded-full object-cover border border-border shrink-0" />
                ) : (
                  <DefaultAvatar className="w-7 h-7 shrink-0" />
                )
              )}
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed relative group ${
                  isOwn
                    ? 'bg-primary text-black rounded-br-none font-medium'
                    : 'bg-surface-variant text-text-primary rounded-bl-none border border-slate-800/80'
                }`}
              >
                {editingMessageId === msg.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-black/30 border border-slate-700 rounded p-1.5 text-xs text-white resize-none"
                      rows={2}
                    />
                    <div className="flex gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMessageId(null)
                          setEditText('')
                        }}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-text-muted hover:text-white"
                      >
                        <X size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={!editText.trim()}
                        onClick={() => handleUpdateMessage(msg.id)}
                        className="p-1 rounded bg-emerald-500 text-black hover:opacity-90"
                      >
                        <Check size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    
                    {isOwn && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMessageId(msg.id)
                          setEditText(msg.message)
                        }}
                        className="absolute -left-6 top-1/2 -translate-y-1/2 p-1 rounded bg-slate-900/80 border border-slate-800 text-text-muted hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit2 size={10} />
                      </button>
                    )}
                  </>
                )}

                <div className="flex items-center justify-between gap-2 mt-1">
                  {msg.updated_at && (
                    <span className={`text-[8px] italic ${isOwn ? 'text-black/40' : 'text-text-disabled'}`}>
                      (edited {timeAgo(msg.updated_at)})
                    </span>
                  )}
                  <p className={`text-[9px] text-right ml-auto ${isOwn ? 'text-black/60' : 'text-text-muted'}`}>
                    {timeAgo(msg.created_at)}
                  </p>
                </div>
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
