'use client'

import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'

interface OGData {
  title: string | null
  description: string | null
  image: string | null
  url: string
  siteName: string | null
}

const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/

export function LinkPreview({ content }: { content: string }) {
  const [og, setOg] = useState<OGData | null>(null)
  const [loading, setLoading] = useState(false)
  const [imgError, setImgError] = useState(false)

  const url = content.match(URL_REGEX)?.[0] ?? null

  useEffect(() => {
    if (!url) return
    setLoading(true)
    setOg(null)
    setImgError(false)

    fetch(`/api/og-preview?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((data: OGData & { error?: string }) => {
        if (!data.error) setOg(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [url])

  if (!url) return null

  if (loading) {
    return (
      <div className="mt-1 mb-3 h-16 rounded-lg border border-border bg-surface-variant animate-pulse" />
    )
  }

  if (!og) return null

  let hostname = url
  try { hostname = new URL(url).hostname.replace(/^www\./, '') } catch { /* */ }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 mb-3 flex overflow-hidden rounded-lg border border-border bg-surface-variant hover:border-primary/40 transition-colors group"
    >
      {og.image && !imgError && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={og.image}
          alt={og.title ?? ''}
          className="w-24 shrink-0 object-cover self-stretch"
          onError={() => setImgError(true)}
        />
      )}
      <div className="p-3 flex flex-col justify-center min-w-0 flex-1 gap-0.5">
        <p className="text-[10px] text-text-muted uppercase tracking-wide truncate">
          {og.siteName || hostname}
        </p>
        {og.title && (
          <p className="text-sm font-semibold text-text-primary line-clamp-1">{og.title}</p>
        )}
        {og.description && (
          <p className="text-xs text-text-secondary line-clamp-2">{og.description}</p>
        )}
      </div>
      <div className="p-3 flex items-center shrink-0">
        <ExternalLink size={14} className="text-text-muted group-hover:text-primary transition-colors" />
      </div>
    </a>
  )
}
