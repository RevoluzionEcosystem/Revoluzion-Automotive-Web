'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, UserMinus, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

interface FollowButtonProps {
  profileId: string
  initialIsFollowing: boolean
  onFollowChange?: (isFollowing: boolean) => void
}

export default function FollowButton({ profileId, initialIsFollowing, onFollowChange }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function getSession() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        // Check real initial state dynamically
        const { data } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profileId)
          .maybeSingle()
        
        if (data) {
          setIsFollowing(true)
          if (onFollowChange) onFollowChange(true)
        }
      }
    }
    getSession()
  }, [profileId, supabase])

  async function handleFollowToggle() {
    if (!currentUserId) {
      toast.error('Sign in required 🔒', { description: 'Please log in to follow other automotive enthusiasts.' })
      return
    }

    if (currentUserId === profileId) {
      toast.error('Self-interaction 🛑', { description: "You can't follow yourself!" })
      return
    }

    setLoading(true)
    if (isFollowing) {
      // Unfollow
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', profileId)

      if (error) {
        toast.error('Action failed', { description: 'Could not unfollow user. Please try again.' })
      } else {
        setIsFollowing(false)
        if (onFollowChange) onFollowChange(false)
        toast.success('Unfollowed', { description: 'You have unfollowed this member.' })
      }
    } else {
      // Follow
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: currentUserId,
          following_id: profileId,
        })

      if (error) {
        toast.error('Action failed', { description: 'Could not follow user. Please try again.' })
      } else {
        setIsFollowing(true)
        if (onFollowChange) onFollowChange(true)
        toast.success('Following! 🏎️', { description: 'You are now following this community member.' })
      }
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleFollowToggle}
      disabled={loading}
      className={`shrink-0 sm:self-start flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
        isFollowing
          ? 'bg-surface-variant hover:bg-surface-variant/80 text-text-primary border border-border'
          : 'bg-primary hover:bg-primary/95 text-background font-bold shadow-lg shadow-primary/20'
      }`}
    >
      {isFollowing ? (
        <>
          <UserMinus size={14} /> Unfollow
        </>
      ) : (
        <>
          <UserPlus size={14} /> Follow
        </>
      )}
    </button>
  )
}
