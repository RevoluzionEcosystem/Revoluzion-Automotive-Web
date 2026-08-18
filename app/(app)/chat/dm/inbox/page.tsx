'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, MessageSquare, ArrowRight, UserCircle, Send, Star, Hash, Edit2, Check, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { timeAgo } from '@/lib/utils'
import { toast } from 'sonner'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// Simple helper formatting matches local to the layout page
function isSameDay(d1Str: string, d2Str: string): boolean {
  try {
    const d1 = new Date(d1Str)
    const d2 = new Date(d2Str)
    return d1.toDateString() === d2.toDateString()
  } catch {
    return false
  }
}

function dateSeparatorLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

interface Participant {
  participant_id: string
  username: string
  display_name: string
  avatar_url: string
  last_message: string
  last_msg_at: string
}

interface DMMessage {
  id: string
  sender_id: string
  recipient_id: string
  message: string
  created_at: string
  updated_at?: string | null
}

export default function DMInboxPage() {
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null)
  const [conversations, setConversations] = useState<Participant[]>([])
  const [activeParticipant, setActiveParticipant] = useState<Participant | null>(null)
  const [messages, setMessages] = useState<DMMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingInbox, setLoadingInbox] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Direct DM edit state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  // Auth User check
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user)
        fetchDirectChatInbox(user.id)
      } else {
        setLoadingInbox(false)
      }
    })
  }, [supabase])

  // Get active Inbox Threads
  async function fetchDirectChatInbox(uid: string, autoSelectId?: string) {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('sender_id, recipient_id, message, created_at')
        .or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (!data || data.length === 0) {
        setConversations([])
        setLoadingInbox(false)
        return
      }

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

      const participantDocs: Participant[] = []
      for (const [pId, detail] of uniqueParticipants.entries()) {
        const { data: profile } = await supabase
          .from('users')
          .select('id, username, display_name, avatar_url')
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

      // Set initial active participant if none selected
      if (participantDocs.length > 0) {
        const toSelect = autoSelectId 
          ? (participantDocs.find(p => p.participant_id === autoSelectId) || participantDocs[0])
          : participantDocs[0]

        setActiveParticipant(toSelect)
        fetchMessagesBetween(uid, toSelect.participant_id)
      }
    } catch {
      console.error('Error fetching inbox.')
    } finally {
      setLoadingInbox(false)
    }
  }

  // Fetch DM messages for active thread
  async function fetchMessagesBetween(uid: string, otherId: string) {
    setLoadingMessages(true)
    try {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${uid},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${uid})`
        )
        .order('created_at', { ascending: true })
        .limit(100)

      setMessages((data ?? []) as DMMessage[])
    } catch {
      console.error('Error loading messages.')
    } finally {
      setLoadingMessages(false)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  // Realtime messages subscription for selected participant
  useEffect(() => {
    if (!currentUser || !activeParticipant) return
    const recipientId = activeParticipant.participant_id

    const channel = supabase
      .channel(`dm-inbox-${recipientId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (payload) => {
        const msg = payload.new as DMMessage
        if (
          (msg.sender_id === currentUser.id && msg.recipient_id === recipientId) ||
          (msg.sender_id === recipientId && msg.recipient_id === currentUser.id)
        ) {
          setMessages((prev) => {
            // Prevent duplicate message from both local optimistic appending and postgres realtime inserting
            if (prev.some(m => m.id === msg.id)) {
              return prev
            }
            return [...prev, msg]
          })
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'direct_messages' }, (payload) => {
        const msg = payload.new as DMMessage
        if (
          (msg.sender_id === currentUser.id && msg.recipient_id === recipientId) ||
          (msg.sender_id === recipientId && msg.recipient_id === currentUser.id)
        ) {
          setMessages((prev) => prev.map(m => m.id === msg.id ? msg : m))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser, activeParticipant, supabase])

  // Click handler for sidebar threads
  const handleSelectThread = (participant: Participant) => {
    if (!currentUser) return
    setActiveParticipant(participant)
    fetchMessagesBetween(currentUser.id, participant.participant_id)
  }

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const msgText = text.trim()
    if (!msgText || !currentUser || !activeParticipant) return

    setSending(true)
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: currentUser.id,
          recipient_id: activeParticipant.participant_id,
          message: msgText
        })
        .select()
        .single()

      if (error) throw error

      setText('')
      setMessages((prev) => [...prev, data as DMMessage])
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

      // Refresh sidebar order/last message
      fetchDirectChatInbox(currentUser.id, activeParticipant.participant_id)
    } catch (err: any) {
      toast.error('Message failed', { description: err.message })
    } finally {
      setSending(false)
    }
  }

  // Update/Edit message
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

      setMessages((prev) => prev.map(m => m.id === msgId ? (data as DMMessage) : m))
      setEditingMessageId(null)
      setEditText('')
      toast.success('Message updated successfully!')
    } catch (err: any) {
      toast.error('Failed to update message', { description: err.message })
    }
  }

  if (loadingInbox) {
    return (
      <div className="w-full h-[calc(100dvh-140px)] flex items-center justify-center text-xs text-text-muted">
        Loading DM threads...
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>Access Restricted</h2>
        <p className="text-text-secondary text-sm">Please sign in to read your inbox messages.</p>
        <Link href="/login" className="btn-primary inline-block">Sign In</Link>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 space-y-6 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700/60 pb-3 gap-2">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>
            Personal DM Inbox
          </h1>
          <p className="text-text-secondary text-xs">Chat directly with buyers and sellers privately</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        
        {/* Left column: Direct messaging personal inboxes list */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-4 rounded-xl border border-slate-700/80 bg-surface/30 space-y-3.5 h-[calc(100dvh-180px)] overflow-y-auto">
            <div className="flex items-center gap-1.5 pb-2.5 border-b border-slate-800">
              <Mail className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-black uppercase tracking-widest text-text-primary" style={{ fontFamily: 'var(--font-orbitron)' }}>
                Conversations ({conversations.length})
              </h2>
            </div>

            {conversations.length === 0 ? (
              <div className="p-4 bg-surface/20 border border-slate-800/80 rounded-xl text-center text-text-muted text-[11px] leading-relaxed">
                Your direct list is empty. Ask sellers on product keys to open active secure dialogs.
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => {
                  const isActive = activeParticipant?.participant_id === conv.participant_id
                  return (
                    <button
                      key={conv.participant_id}
                      onClick={() => handleSelectThread(conv)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs space-y-1 block ${
                        isActive
                          ? 'bg-primary/10 border-primary text-white shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                          : 'bg-gradient border-slate-800 text-text-secondary hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {conv.avatar_url ? (
                          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-slate-700">
                            <Image src={conv.avatar_url} fill className="object-cover" alt="" />
                          </div>
                        ) : (
                          <DefaultAvatar className="w-6 h-6" />
                        )}
                        <span className="font-bold truncate text-[11px] text-white">
                          {conv.display_name}
                        </span>
                      </div>
                      <p className="truncate text-[10.5px] text-text-muted mt-0.5">
                        {conv.last_message}
                      </p>
                      <span className="text-[9px] text-text-disabled block text-right">
                        {timeAgo(conv.last_msg_at)}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Selected User Messages */}
        <div className="lg:col-span-3">
          <div className="flex flex-col h-[calc(100dvh-180px)] border border-slate-700 bg-surface/30 rounded-xl overflow-hidden shadow-xl">
            {activeParticipant ? (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface shrink-0">
                  {activeParticipant.avatar_url ? (
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-700/80">
                      <Image
                        src={activeParticipant.avatar_url}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <DefaultAvatar className="w-9 h-9" />
                  )}
                  <div>
                    <h2 className="font-semibold text-text-primary text-sm">
                      {activeParticipant.display_name}
                    </h2>
                    <div className="text-text-muted text-[11px]">@{activeParticipant.username}</div>
                  </div>
                </div>

                {/* Messages Panel */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                  {loadingMessages ? (
                    <div className="h-full flex items-center justify-center text-text-muted text-xs animate-pulse">
                      Retrieving conversations securely...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-text-muted">
                      No messages here yet. Type down below to initialize!
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isOwn = msg.sender_id === currentUser.id
                      const prev = messages[i - 1]
                      const showDate = !prev || !isSameDay(prev.created_at, msg.created_at)

                      return (
                        <div key={msg.id} className="space-y-3">
                          {showDate && (
                            <div className="flex items-center gap-3 my-2.5">
                              <div className="flex-1 h-px bg-slate-800" />
                              <span className="text-text-muted text-[9px] font-medium px-1 uppercase tracking-wider shrink-0">
                                {dateSeparatorLabel(msg.created_at)}
                              </span>
                              <div className="flex-1 h-px bg-slate-800" />
                            </div>
                          )}

                          <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                            {!isOwn && (
                              activeParticipant.avatar_url ? (
                                <div className="relative w-7 h-7 rounded-full overflow-hidden border border-slate-800 shrink-0">
                                  <Image src={activeParticipant.avatar_url} fill className="object-cover" alt="" />
                                </div>
                              ) : (
                                <DefaultAvatar className="w-7 h-7 shrink-0" />
                              )
                            )}
                            <div
                              className={`max-w-[70%] px-3.5 py-2 rounded-xl text-xs leading-relaxed relative group ${
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
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input form */}
                <form onSubmit={handleSend} className="px-4 py-3 border-t border-slate-800/80 bg-surface flex gap-2 shrink-0">
                  <input
                    type="text"
                    required
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={`Private message @${activeParticipant.display_name}...`}
                    maxLength={1000}
                    disabled={sending}
                    style={{ fontFamily: 'var(--font-inter), sans-serif' }}
                    className="input flex-1 bg-background text-xs h-10 px-3 border border-slate-800 focus:border-primary/50 text-white rounded-xl"
                  />
                  <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    className="h-10 px-4 bg-primary text-black uppercase font-bold tracking-wider rounded-xl transition-all hover:opacity-95 active:scale-98 flex items-center justify-center shrink-0"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full" />
                    ) : (
                      <Send size={15} />
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-muted bg-surface/10 space-y-2">
                <Hash size={40} className="stroke-[1.5] text-primary/30 animate-pulse" />
                <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'var(--font-orbitron)' }}>No Active Conversation</h3>
                <p className="text-xs max-w-sm text-text-disabled">Select an existing thread from your private sidebar converser index, or find listings parts to inquire sellers directly!</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
