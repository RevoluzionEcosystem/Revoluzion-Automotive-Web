'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  itemId: string
  likeTable: string
  idField: string
  parentTable: string
  initialLikes: number
}

/**
 * Generic like button for feed activity items (car / build / event).
 * Mirrors the mobile app's like behavior so both platforms stay in sync.
 */
export function ActivityLikeButton({ itemId, likeTable, idField, parentTable, initialLikes }: Props) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null)
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null)

  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
    staleTime: 5 * 60 * 1000,
  })

  const { data: isLiked = false } = useQuery({
    queryKey: [likeTable, 'is-liked', itemId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false
      const { data } = await supabase
        .from(likeTable)
        .select('id')
        .eq(idField, itemId)
        .eq('user_id', user.id)
        .maybeSingle()
      return !!data
    },
    enabled: !!user?.id,
  })

  const { data: likesCount = initialLikes } = useQuery({
    queryKey: [likeTable, 'count', itemId],
    queryFn: async () => {
      const { data } = await supabase
        .from(parentTable)
        .select('likes_count')
        .eq('id', itemId)
        .single()
      return data?.likes_count ?? initialLikes
    },
  })

  const currentLiked = optimisticLiked !== null ? optimisticLiked : isLiked
  const currentCount = optimisticCount !== null ? optimisticCount : likesCount

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error('Sign in required 🔒', { description: 'Please sign in to like this.' })
        return
      }
      const nextLiked = !currentLiked
      const nextCount = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1)

      setOptimisticLiked(nextLiked)
      setOptimisticCount(nextCount)

      if (currentLiked) {
        const { error } = await supabase
          .from(likeTable)
          .delete()
          .eq(idField, itemId)
          .eq('user_id', user.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from(likeTable)
          .insert({ [idField]: itemId, user_id: user.id })
        if (error) throw error
      }

      // Keep denormalized count in sync
      await supabase.from(parentTable).update({ likes_count: nextCount }).eq('id', itemId)
    },
    onError: () => {
      setOptimisticLiked(null)
      setOptimisticCount(null)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aggregated-feed'] }),
  })

  return (
    <button
      onClick={() => toggle.mutate()}
      disabled={toggle.isPending}
      className={`flex items-center gap-1.5 text-sm transition-colors disabled:opacity-60 ${currentLiked ? 'text-error' : 'text-text-muted hover:text-error'}`}
      aria-label={currentLiked ? 'Unlike' : 'Like'}
    >
      <Heart size={16} style={currentLiked ? { fill: 'currentColor' } : undefined} />
      <span className="tabular-nums">{currentCount}</span>
    </button>
  )
}
