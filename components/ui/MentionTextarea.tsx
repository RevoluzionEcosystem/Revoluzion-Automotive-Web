'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { DefaultAvatar } from './DefaultAvatar'

interface Profile {
  username: string
  display_name: string | null
  avatar_url: string | null
}

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  className?: string
  disabled?: boolean
}

export function MentionTextarea({ value, onChange, placeholder, maxLength, className, disabled }: Props) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [results, setResults] = useState<Profile[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value
      onChange(val)

      const cursor = e.target.selectionStart ?? val.length
      const before = val.slice(0, cursor)
      const match = before.match(/@([a-zA-Z0-9_]*)$/)

      if (match) {
        setMentionQuery(match[1])
        setActiveIdx(0)
      } else {
        setMentionQuery(null)
        setResults([])
      }
    },
    [onChange],
  )

  useEffect(() => {
    if (mentionQuery === null) {
      setResults([])
      return
    }

    const q = mentionQuery
    const query = q
      ? supabase.from('users').select('username, display_name, avatar_url').ilike('username', `${q}%`).limit(6)
      : supabase.from('users').select('username, display_name, avatar_url').limit(6)

    query.then(({ data }) => {
      if (data) setResults(data as Profile[])
    })
  }, [mentionQuery, supabase])

  const insertMention = useCallback(
    (username: string) => {
      const el = textareaRef.current
      const cursor = el?.selectionStart ?? value.length
      const before = value.slice(0, cursor)
      const after = value.slice(cursor)
      const match = before.match(/@([a-zA-Z0-9_]*)$/)
      if (!match) return

      const newValue = value.slice(0, match.index!) + `@${username} ` + after
      onChange(newValue)
      setMentionQuery(null)
      setResults([])

      requestAnimationFrame(() => {
        if (el) {
          const newCursor = match.index! + username.length + 2
          el.focus()
          el.setSelectionRange(newCursor, newCursor)
        }
      })
    },
    [value, onChange],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (mentionQuery === null || results.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => (i + 1) % results.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => (i - 1 + results.length) % results.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        const profile = results[activeIdx]
        if (profile) {
          e.preventDefault()
          insertMention(profile.username)
        }
      } else if (e.key === 'Escape') {
        setMentionQuery(null)
        setResults([])
      }
    },
    [mentionQuery, results, activeIdx, insertMention],
  )

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        className={className}
        disabled={disabled}
      />

      {mentionQuery !== null && results.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-64 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <p className="px-3 py-1.5 text-[10px] text-text-muted uppercase tracking-wider border-b border-border/50">
            Members
          </p>
          {results.map((profile, i) => (
            <button
              key={profile.username}
              type="button"
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                i === activeIdx ? 'bg-primary/10' : 'hover:bg-surface-variant'
              }`}
              onMouseDown={(e) => {
                e.preventDefault()
                insertMention(profile.username)
              }}
            >
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full object-cover border border-border shrink-0"
                />
              ) : (
                <DefaultAvatar className="w-7 h-7 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary truncate">
                  {profile.display_name || profile.username}
                </p>
                <p className="text-xs text-text-muted truncate">@{profile.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
