'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

interface Props {
  eventId: string
  initialLikes?: number
}

export function EventLikeButton({ eventId, initialLikes = 0 }: Props) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null)
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null)

  // 1. Get current authenticated user
  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
    staleTime: 5 * 60 * 1000,
  })

  // 2. Fetch has current user liked this specific event
  const { data: isLiked = false, refetch: refetchLikeState } = useQuery({
    queryKey: ['event-is-liked', eventId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false
      const { data } = await supabase
        .from('event_likes')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle()
      return !!data
    },
    enabled: !!user?.id,
  })

  // 3. Fetch current live likes count for this event
  const { data: likesCount = initialLikes, refetch: refetchLikesCount } = useQuery({
    queryKey: ['event-likes-count', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('likes_count')
        .eq('id', eventId)
        .single()
      if (error) return initialLikes
      return data.likes_count || 0
    },
  })

  const currentLiked = optimisticLiked !== null ? optimisticLiked : isLiked
  const currentCount = optimisticCount !== null ? optimisticCount : likesCount

  // 4. Toggle Like Mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error('Sign in required 🔒', { description: 'Please log in to like this event.' })
        return { liked: currentLiked }
      }

      const nextLikedState = !currentLiked
      const nextCountState = nextLikedState ? currentCount + 1 : Math.max(0, currentCount - 1)

      // Apply optimistic states instantly in user interface
      setOptimisticLiked(nextLikedState)
      setOptimisticCount(nextCountState)

      if (currentLiked) {
        // Delete like row
        const { error } = await supabase
          .from('event_likes')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id)

        if (error) throw error

        // Decrement events counter
        await supabase
          .from('events')
          .update({ likes_count: nextCountState })
          .eq('id', eventId)
      } else {
        // Insert like row
        const { error } = await supabase
          .from('event_likes')
          .insert({ event_id: eventId, user_id: user.id })

        if (error) throw error

        // Increment events counter
        await supabase
          .from('events')
          .update({ likes_count: nextCountState })
          .eq('id', eventId)
      }

      return { liked: nextLikedState }
    },
    onSuccess: (data) => {
      refetchLikeState()
      refetchLikesCount()
      // Invalidate general event details and grids queries
      queryClient.invalidateQueries({ queryKey: ['event-is-liked', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event-likes-count', eventId] })
      
      if (data) {
        toast.success(data.liked ? 'Added to your favorites! ❤️' : 'Removed from your favorites')
      }
    },
    onError: (err: any) => {
      toast.error('Could not log like preference', { description: err.message })
    },
    onSettled: () => {
      // Clear optimistic overrides and bind back to server queries securely
      setOptimisticLiked(null)
      setOptimisticCount(null)
    }
  })

  return (
    <button
      onClick={() => toggleLikeMutation.mutate()}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase transition-all duration-300 rounded-md tracking-wider border ${
        currentLiked
          ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-md shadow-red-500/5'
          : 'bg-white/5 border-white/10 text-text-secondary hover:bg-white/10 hover:border-white/25 hover:text-white'
      }`}
      style={{ fontFamily: 'var(--font-orbitron)' }}
    >
      <Heart
        size={11}
        className={`${currentLiked ? 'fill-red-500 stroke-red-500' : 'text-text-muted group-hover:text-white'}`}
      />
      <span>Like Meet ({currentCount})</span>
    </button>
  )
}
