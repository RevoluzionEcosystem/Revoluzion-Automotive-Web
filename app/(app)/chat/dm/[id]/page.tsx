'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, ArrowLeft, Edit2, Check, X, Loader2 } from 'lucide-react'
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

const PAGE_SIZE = 50
const MAX_MESSAGES = 10_000

export default function DMPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const recipientId = params.id as string
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [text, setText] = useState('')
  const [recipientProfile, setRecipientProfile] = useState<any>(null)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const lastMessageIdRef = useRef<string | null>(null)

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

  // Fetch DMs between current user and recipient (latest first)
  const { data } = useQuery({
    queryKey: ['dm', recipientId],
    queryFn: async () => {
      if (!user) return { messages: [], hasMore: false }
      const { data: rows } = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`
        )
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)
      const msgs = ((rows ?? []) as DMMessage[]).reverse()
      return { messages: msgs, hasMore: msgs.length === PAGE_SIZE }
    },
    enabled: !!user,
    staleTime: 0,
  })

  const messages = data?.messages ?? []
  const hasMore = data?.hasMore ?? false

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
          queryClient.setQueryData(['dm', recipientId], (prev: { messages: DMMessage[]; hasMore: boolean } | undefined) => {
            if (!prev) return prev
            if (prev.messages.some(m => m.id === msg.id)) return prev
            return { ...prev, messages: [...prev.messages, msg] }
          })
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'direct_messages' }, (payload) => {
        const msg = payload.new as DMMessage
        if (
          (msg.sender_id === user.id && msg.recipient_id === recipientId) ||
          (msg.sender_id === recipientId && msg.recipient_id === user.id)
        ) {
          queryClient.setQueryData(['dm', recipientId], (prev: { messages: DMMessage[]; hasMore: boolean } | undefined) => {
            if (!prev) return prev
            return { ...prev, messages: prev.messages.map(m => m.id === msg.id ? { ...m, ...msg } : m) }
          })
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, recipientId, supabase, queryClient])

  // Auto scroll to the latest message (only on new messages, and only when near the bottom)
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (!last || last.id === lastMessageIdRef.current) return
    const isInitial = lastMessageIdRef.current === null
    lastMessageIdRef.current = last.id
    const el = scrollRef.current
    if (el && !isInitial && el.scrollHeight - el.scrollTop - el.clientHeight > 240) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadOlder = useCallback(async () => {
    if (!user || !hasMore || loadingOlder || messages.length >= MAX_MESSAGES) return
    const oldest = messages[0]?.created_at
    if (!oldest) return
    setLoadingOlder(true)
    const { data: rows } = await supabase
      .from('direct_messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`
      )
      .lt('created_at', oldest)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    const older = ((rows ?? []) as DMMessage[]).reverse()
    queryClient.setQueryData(['dm', recipientId], (prev: { messages: DMMessage[]; hasMore: boolean } | undefined) => {
      if (!prev) return prev
      const merged = [...older, ...prev.messages]
      return { messages: merged, hasMore: older.length === PAGE_SIZE && merged.length < MAX_MESSAGES }
    })
    setLoadingOlder(false)
  }, [user, recipientId, supabase, queryClient, hasMore, loadingOlder, messages])

  // Load older messages when scrolling to the top
  useEffect(() => {
    const el = topSentinelRef.current
    const root = scrollRef.current
    if (!el || !root || !hasMore || loadingOlder) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && root.scrollHeight > root.clientHeight + 40) loadOlder()
      },
      { root, rootMargin: '160px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadOlder, hasMore, loadingOlder])

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

      queryClient.setQueryData(['dm', recipientId], (prev: { messages: DMMessage[]; hasMore: boolean } | undefined) => {
        if (!prev) return prev
        return { ...prev, messages: prev.messages.map(m => m.id === msgId ? { ...m, ...data } : m) }
      })
      setEditingMessageId(null)
      setEditText('')
      toast.success('Message updated!')
    } catch (err: any) {
      toast.error('Failed to update message', { description: err.message })
    }
  }

  if (user && user.id === recipientId) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-9rem)] lg:h-[calc(100vh-64px)] p-6 text-center text-text-muted">
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
    <div className="flex flex-col h-[calc(100dvh-9rem)] lg:h-[calc(100vh-64px)] max-w-2xl mx-auto">
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <div ref={topSentinelRef} className="h-px" aria-hidden />
        {hasMore || loadingOlder ? (
          <div className="flex items-center justify-center py-2">
            {loadingOlder ? (
              <span className="flex items-center gap-2 text-text-muted text-xs">
                <Loader2 size={13} className="animate-spin text-primary" />
                Loading older messages…
              </span>
            ) : (
              <button type="button" onClick={loadOlder} className="text-xs text-text-muted hover:text-primary transition-colors">
                Load older messages
              </button>
            )}
          </div>
        ) : (
          messages.length > 0 && (
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-text-muted uppercase tracking-wider">Start of conversation</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )
        )}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-text-muted text-sm">
            <p>No messages yet</p>
            <p className="text-xs mt-1">Start a conversation</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === user?.id
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''} [content-visibility:auto] [contain-intrinsic-size:auto_56px]`}>
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
