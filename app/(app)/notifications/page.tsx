'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import type { Notification } from '@/lib/supabase/types'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const NOTIFICATION_ICONS: Record<string, string> = {
  like: '❤️',
  comment: '💬',
  follow: '👥',
  event: '📅',
  announcement: '📢',
  default: '🔔',
}

export default function NotificationsPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      return (data ?? []) as Notification[]
    },
    enabled: !!user,
  })

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user) return
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('All caught up! ✅', { description: 'All notifications have been marked as read.' })
    },
  })

  const markOne = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  if (!user && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted px-4">
        <Bell size={48} className="mb-4 opacity-30" />
        <p className="text-lg mb-2">Sign in to view notifications</p>
        <a href="/login" className="btn-primary mt-4">Sign In</a>
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-text-muted text-sm mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse flex gap-3">
              <div className="w-9 h-9 rounded-full bg-surface-variant shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-surface-variant rounded w-3/4" />
                <div className="h-2 bg-surface-variant rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <Bell size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">No notifications yet</p>
          <p className="text-sm mt-1">We'll let you know when something happens</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => { if (!notif.is_read) markOne.mutate(notif.id) }}
              className={`card p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                !notif.is_read ? 'border-primary/20 bg-primary/5' : 'hover:bg-surface-variant/50'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-surface-variant flex items-center justify-center text-base shrink-0">
                {NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.default}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-text-primary text-sm">{notif.title}</div>
                {notif.body && (
                  <p className="text-text-secondary text-sm mt-0.5 line-clamp-2">{notif.body}</p>
                )}
                <div className="text-text-muted text-xs mt-1">{timeAgo(notif.created_at)}</div>
              </div>
              {!notif.is_read && (
                <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
