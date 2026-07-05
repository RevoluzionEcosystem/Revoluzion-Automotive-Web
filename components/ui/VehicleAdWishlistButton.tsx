'use client'

import React, { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Props {
  vehicleId: string
}

export function VehicleAdWishlistButton({ vehicleId }: Props) {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function checkSaved() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('vehicle_wishlists')
        .select('*')
        .eq('user_id', user.id)
        .eq('vehicle_id', vehicleId)
        .maybeSingle()

      if (data) {
        setSaved(true)
      }
    }
    checkSaved()
  }, [vehicleId, supabase])

  async function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Sign In Required 🔒', {
        description: 'Please sign in to add vehicles to your wishlist.',
      })
      return
    }

    setLoading(true)
    if (saved) {
      const { error } = await supabase
        .from('vehicle_wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('vehicle_id', vehicleId)

      if (error) {
        toast.error('Failed to remove from wishlist')
      } else {
        setSaved(false)
        toast.success('Removed vehicle from your wishlist')
      }
    } else {
      const { error } = await supabase
        .from('vehicle_wishlists')
        .insert({ user_id: user.id, vehicle_id: vehicleId })

      if (error) {
        toast.error('Failed to save to wishlist')
      } else {
        setSaved(true)
        toast.success('Saved vehicle! Find it in your profile garage.')
      }
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`absolute top-3 right-3 p-2 rounded-full border transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur ${
        saved
          ? 'bg-red-500/10 border-red-500/30 text-red-500'
          : 'bg-black/60 border-slate-700 text-slate-400 hover:text-white'
      }`}
    >
      <Heart size={14} className={saved ? 'fill-current animate-ping-once' : ''} />
    </button>
  )
}
