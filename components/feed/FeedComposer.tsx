'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { Image as ImageIcon, X, Send, AtSign, Radio } from 'lucide-react'
import { MentionTextarea } from '@/components/ui/MentionTextarea'
import { LinkPreview } from '@/components/ui/LinkPreview'
import { SafeImage } from '@/components/ui/SafeImage'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { toast } from 'sonner'
import { checkPostSpam } from './types'

interface FeedComposerProps {
  currentUserId: string
  avatarUrl?: string | null
  displayName?: string | null
}

export function FeedComposer({ currentUserId, avatarUrl, displayName }: FeedComposerProps) {
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const queryClient = useQueryClient()

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large', { description: 'Please choose an image under 5 MB.' })
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() && !imageFile) return

    const spamError = checkPostSpam()
    if (spamError) {
      toast.warning('Slow down! 🛑', { description: spamError })
      return
    }

    setSubmitting(true)

    let imageUrl: string | null = null
    if (imageFile) {
      const path = `posts/${currentUserId}/${Date.now()}_${imageFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(path, imageFile, { cacheControl: '31536000' })
      if (uploadError) {
        toast.error('Image upload failed', { description: 'Could not upload your photo. Please try again.' })
        setSubmitting(false)
        return
      }
      const { data } = supabase.storage.from('post-images').getPublicUrl(path)
      imageUrl = data.publicUrl
    }

    const { error } = await supabase.from('posts').insert({
      user_id: currentUserId,
      content: content.trim(),
      image_url: imageUrl,
    })

    if (error) {
      toast.error('Post failed', { description: 'Could not publish your post. Please try again.' })
    } else {
      setContent('')
      setImageFile(null)
      setImagePreview(null)
      queryClient.invalidateQueries({ queryKey: ['aggregated-feed'] })
      toast.success('Post published! 🚀', { description: 'Your post is now live in the community feed.' })
    }
    setSubmitting(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-white/6 bg-gradient p-4 sm:p-5 mb-5 shadow-xl transition-all duration-300 hover:border-white/10 animate-fade-in-up"
    >
      <div className="flex items-center gap-2 mb-3 select-none">
        <Radio size={14} className="text-primary" />
        <span
          className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          Broadcast to the feed
        </span>
      </div>

      <div className="flex items-start gap-3">
        <UserAvatar src={avatarUrl} name={displayName || 'You'} className="w-10 h-10" />
        <div className="flex-1 min-w-0">
          <MentionTextarea
            value={content}
            onChange={setContent}
            placeholder="What's happening in the automotive world? Use @ to mention members."
            className="input resize-none text-sm min-h-24 bg-black text-white w-full border border-white/10"
            maxLength={20000}
          />
        </div>
      </div>
      <LinkPreview content={content} />

      {imagePreview && (
        <div className="relative mb-3 inline-block">
          <div className="w-56 h-40 rounded-lg overflow-hidden border border-border relative">
            <SafeImage src={imagePreview} alt="Preview" fill className="object-cover" />
          </div>
          <button
            type="button"
            onClick={() => {
              setImageFile(null)
              setImagePreview(null)
            }}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/80 rounded-full flex items-center justify-center text-white hover:bg-error transition-colors z-10"
            aria-label="Remove image"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-surface-variant transition-colors"
            title="Add image"
            aria-label="Add image"
          >
            <ImageIcon size={18} />
          </button>
          <div className="hidden sm:flex items-center gap-1 text-text-muted/60 text-xs" title="Type @ to mention members">
            <AtSign size={13} />
            <span>mention</span>
          </div>
          <span className="text-text-muted text-xs tabular-nums ml-auto sm:ml-0">{content.length}/20000</span>
        </div>
        <button
          type="submit"
          disabled={submitting || (!content.trim() && !imageFile)}
          className="btn-primary py-2 px-4 text-xs flex items-center gap-2 shrink-0"
        >
          <Send size={14} />
          {submitting ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  )
}
