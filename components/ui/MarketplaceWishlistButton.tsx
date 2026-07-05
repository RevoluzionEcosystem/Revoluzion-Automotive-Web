'use client'

import React, { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  listingId: string
}

export function MarketplaceWishlistButton({ listingId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [isChecked, setIsChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        // Check if item is already in wishlist database
        supabase
          .from('wishlists')
          .select('id')
          .eq('user_id', user.id)
          .eq('product_id', listingId)
          .maybeSingle()
          .then(({ data }) => {
            if (data) setIsChecked(true)
          })
      }
    })
  }, [supabase, listingId])

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId) {
      toast.error('Sign In Required 🔒', {
        description: 'Please sign in to add listings to your wishlist.',
      })
      return
    }

    setLoading(true)
    try {
      if (isChecked) {
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', listingId)

        if (!error) {
          setIsChecked(false)
          toast.success('Removed from Wishlist', {
            description: 'Item removed from your saved dashboard wishlist index successfully.',
          })
        }
      } else {
        const { error } = await supabase
          .from('wishlists')
          .insert({
            user_id: userId,
            product_id: listingId,
          })

        if (!error) {
          setIsChecked(true)
          toast.success('Successfully Wishlisted! ♥', {
            description: 'This listing has been added to your saved dashboard wishlist index.',
          })
        }
      }
    } catch {
      toast.error('Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`p-2 rounded-xl border flex items-center justify-center transition-all duration-300 ${
        isChecked
          ? 'bg-rose-500/10 border-rose-500/40 text-rose-500 scale-102 shadow-[0_0_10px_rgba(244,63,94,0.15)]'
          : 'bg-surface/60 border-slate-700/60 text-text-muted hover:border-slate-500 hover:text-white'
      }`}
      aria-label="Wishlist this listing"
    >
      <Heart size={15} className={isChecked ? 'fill-current' : ''} />
    </button>
  )
}
