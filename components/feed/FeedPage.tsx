'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { ArrowUp, Radio } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { FeedSidebar } from '@/components/ui/FeedSidebar'
import { FeedFilterBar } from '@/components/feed/FeedFilterBar'
import { FeedComposer } from '@/components/feed/FeedComposer'
import { PostCard } from '@/components/feed/PostCard'
import { ActivityCard } from '@/components/feed/ActivityCard'
import { type FeedItem, type FeedUser, type TopComment } from '@/components/feed/types'

// ── Lightweight row shapes for the aggregated Supabase queries ──────────────
interface UsersRef {
  id?: string
  username?: string | null
  display_name?: string | null
  avatar_url?: string | null
  is_verified?: boolean
}
type Ref = UsersRef | UsersRef[] | null

function profileOf(u: Ref): FeedUser {
  const p = Array.isArray(u) ? (u[0] ?? null) : u
  return {
    username: p?.username ?? null,
    display_name: p?.display_name ?? null,
    avatar_url: p?.avatar_url ?? null,
    is_verified: Boolean(p?.is_verified),
  }
}

interface PostRow {
  id: string
  user_id: string
  content: string
  image_url: string | null
  likes_count: number
  comments_count: number
  created_at: string
  updated_at: string | null
  users: Ref
}
interface CarRow {
  id: string
  user_id: string
  make: string | null
  model: string | null
  year: number | string | null
  color: string | null
  image_url: string | null
  car_bio: string | null
  created_at: string
  updated_at: string | null
  users: Ref
}
interface BuildRow {
  id: string
  user_id: string
  title: string | null
  description: string | null
  image_url: string | null
  mods: string[] | null
  created_at: string
  updated_at: string | null
  users: Ref
}
interface EventRow {
  id: string
  user_id: string
  title: string | null
  category: string | null
  date: string | null
  location: string | null
  banner_url: string | null
  created_at: string
  updated_at: string | null
  users: Ref
}
interface ListingRow {
  id: string
  user_id: string
  title: string | null
  description: string | null
  price: number | null
  category: string | null
  condition: string | null
  created_at: string
  updated_at: string | null
  users: Ref
}
interface ServiceRow {
  id: string
  user_id: string
  title: string | null
  description: string | null
  price: number | null
  category: string | null
  location: string | null
  banner_url: string | null
  created_at: string
  updated_at: string | null
  users: Ref
}
interface UserRow {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  created_at: string
  is_verified: boolean
}

// Maps the `?type=` query param to the internal feed item kind.
const TYPE_FILTER: Record<string, FeedItem['feedType'] | undefined> = {
  posts: 'post',
  garage: 'car',
  builds: 'build',
  events: 'event',
  listings: 'listing',
  services: 'service',
  users: 'user',
}

export default function FeedPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const activeType = searchParams.get('type') || 'all'

  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser()
      return data.user
    },
    staleTime: 5 * 60 * 1000,
  })

  const userId = user?.id ?? null

  const { data: profile } = useQuery({
    queryKey: ['my-profile', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data } = await supabase.from('users').select('username, display_name, avatar_url').eq('id', userId).single()
      return (data as { username: string | null; display_name: string | null; avatar_url: string | null } | null) ?? null
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })

  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const scroller = document.querySelector('main')
      setShowScrollTop((scroller?.scrollTop ?? 0) > 480)
    }
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll, { capture: true })
  }, [])

  function scrollToTop() {
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const { data: aggregatedFeed, isLoading } = useQuery({
    queryKey: ['aggregated-feed', userId],
    queryFn: async () => {
      const [
        { data: postsRaw },
        { data: carsRaw },
        { data: buildsRaw },
        { data: eventsRaw },
        { data: listingsRaw },
        { data: servicesRaw },
        { data: usersRaw },
      ] = await Promise.all([
        supabase
          .from('posts')
          .select('id, user_id, content, image_url, likes_count, comments_count, created_at, updated_at, users!posts_user_id_fkey(id, username, display_name, avatar_url, is_verified)')
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('cars')
          .select('id, user_id, make, model, year, color, image_url, car_bio, created_at, updated_at, users!cars_user_id_fkey(id, username, display_name, avatar_url, is_verified)')
          .order('created_at', { ascending: false })
          .limit(15),
        supabase
          .from('builds')
          .select('id, user_id, title, description, image_url, mods, created_at, updated_at, users!builds_user_id_fkey(id, username, display_name, avatar_url, is_verified)')
          .order('created_at', { ascending: false })
          .limit(15),
        supabase
          .from('events')
          .select('id, user_id, title, category, date, location, banner_url, created_at, updated_at, users(id, username, display_name, avatar_url, is_verified)')
          .order('created_at', { ascending: false })
          .limit(15),
        supabase
          .from('marketplace_listings')
          .select('id, user_id, title, description, price, category, condition, created_at, updated_at, users!fk_marketplace_listings_user_id_to_users(id, username, display_name, avatar_url, is_verified)')
          .order('created_at', { ascending: false })
          .limit(15),
        supabase
          .from('services')
          .select('id, user_id, title, description, price, category, location, created_at, updated_at, users(id, username, display_name, avatar_url, is_verified)')
          .order('created_at', { ascending: false })
          .limit(15),
        supabase
          .from('users')
          .select('id, username, display_name, avatar_url, created_at, is_verified')
          .order('created_at', { ascending: false })
          .limit(15),
      ])

      const items: FeedItem[] = []

      for (const p of (postsRaw ?? []) as PostRow[]) {
        const u = profileOf(p.users)
        items.push({
          id: p.id,
          feedType: 'post',
          created_at: p.created_at,
          updated_at: p.updated_at ?? undefined,
          user_id: p.user_id,
          content: p.content,
          image_url: p.image_url,
          likes_count: p.likes_count,
          comments_count: p.comments_count,
          metadata: {
            username: u.username ?? undefined,
            display_name: u.display_name ?? undefined,
            avatar_url: u.avatar_url ?? undefined,
            is_verified: u.is_verified,
          },
        })
      }

      for (const c of (carsRaw ?? []) as CarRow[]) {
        const u = profileOf(c.users)
        items.push({
          id: c.id,
          feedType: 'car',
          created_at: c.created_at,
          updated_at: c.updated_at ?? undefined,
          user_id: c.user_id,
          content: c.car_bio || `Added ${c.make} ${c.model} to garage pack.`,
          image_url: c.image_url,
          metadata: {
            make: c.make ?? undefined,
            model: c.model ?? undefined,
            year: c.year ?? undefined,
            location: c.color ?? undefined,
            username: u.username ?? undefined,
            display_name: u.display_name ?? undefined,
            avatar_url: u.avatar_url ?? undefined,
            is_verified: u.is_verified,
          },
        })
      }

      for (const b of (buildsRaw ?? []) as BuildRow[]) {
        const u = profileOf(b.users)
        items.push({
          id: b.id,
          feedType: 'build',
          created_at: b.created_at,
          updated_at: b.updated_at ?? undefined,
          user_id: b.user_id,
          content: b.description || 'Updated car build timeline logs.',
          image_url: b.image_url,
          metadata: {
            title: b.title ?? undefined,
            mods: b.mods ?? [],
            username: u.username ?? undefined,
            display_name: u.display_name ?? undefined,
            avatar_url: u.avatar_url ?? undefined,
            is_verified: u.is_verified,
          },
        })
      }

      for (const e of (eventsRaw ?? []) as EventRow[]) {
        const u = profileOf(e.users)
        items.push({
          id: e.id,
          feedType: 'event',
          created_at: e.created_at,
          updated_at: e.updated_at ?? undefined,
          user_id: e.user_id,
          content: `Event scheduled: ${e.title}`,
          image_url: e.banner_url,
          metadata: {
            title: e.title ?? undefined,
            category: e.category ?? undefined,
            location: e.location ?? undefined,
            year: e.date ?? undefined,
            username: u.username ?? undefined,
            display_name: u.display_name ?? undefined,
            avatar_url: u.avatar_url ?? undefined,
            is_verified: u.is_verified,
          },
        })
      }

      for (const l of (listingsRaw ?? []) as ListingRow[]) {
        const u = profileOf(l.users)
        items.push({
          id: l.id,
          feedType: 'listing',
          created_at: l.created_at,
          updated_at: l.updated_at ?? undefined,
          user_id: l.user_id,
          content: l.description || 'Listed component on market.',
          image_url: null,
          metadata: {
            title: l.title ?? undefined,
            price: l.price ?? undefined,
            category: l.category ?? undefined,
            condition: l.condition ?? undefined,
            username: u.username ?? undefined,
            display_name: u.display_name ?? undefined,
            avatar_url: u.avatar_url ?? undefined,
            is_verified: u.is_verified,
          },
        })
      }

      for (const s of (servicesRaw ?? []) as ServiceRow[]) {
        const u = profileOf(s.users)
        items.push({
          id: s.id,
          feedType: 'service',
          created_at: s.created_at,
          updated_at: s.updated_at ?? undefined,
          user_id: s.user_id,
          content: s.description || 'Registered a new automotive service in directory.',
          image_url: s.banner_url ?? null,
          metadata: {
            title: s.title ?? undefined,
            price: s.price ?? undefined,
            category: s.category ?? undefined,
            location: s.location ?? 'Klang Valley',
            username: u.username ?? undefined,
            display_name: u.display_name ?? undefined,
            avatar_url: u.avatar_url ?? undefined,
            is_verified: u.is_verified,
          },
        })
      }

      for (const u of (usersRaw ?? []) as UserRow[]) {
        items.push({
          id: `user-${u.id}`,
          feedType: 'user',
          created_at: u.created_at,
          user_id: u.id,
          content: `${u.display_name || u.username || 'A new member'} joined Revoluzion!`,
          image_url: u.avatar_url,
          metadata: {
            username: u.username ?? undefined,
            display_name: u.display_name ?? undefined,
            avatar_url: u.avatar_url ?? undefined,
            is_verified: u.is_verified,
          },
        })
      }

      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      // Top comment previews for posts
      const postIds = items.filter((x) => x.feedType === 'post').map((x) => x.id)
      const commentMap: Record<string, TopComment> = {}
      if (postIds.length > 0) {
        const { data: comments } = await supabase
          .from('post_comments')
          .select('post_id, content, users!post_comments_user_id_fkey(display_name, username, avatar_url)')
          .in('post_id', postIds)
          .order('created_at', { ascending: false })
          .limit(postIds.length * 3)
        for (const c of (comments ?? []) as Array<{ post_id: string; content: string; users: Ref }>) {
          if (!commentMap[c.post_id]) {
            commentMap[c.post_id] = { content: c.content, users: profileOf(c.users) }
          }
        }
      }

      // Liked state for the current user
      let likedSet = new Set<string>()
      if (userId && postIds.length > 0) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', userId)
          .in('post_id', postIds)
        likedSet = new Set((likes ?? []).map((r) => (r as { post_id: string }).post_id))
      }

      return { items, likedSet, commentMap }
    },
  })

  const likedSet = aggregatedFeed?.likedSet ?? new Set<string>()
  const commentMap = aggregatedFeed?.commentMap ?? {}

  const filteredFeed = useMemo(() => {
    const items = aggregatedFeed?.items ?? []
    const target = TYPE_FILTER[activeType]
    if (!target) return items
    return items.filter((i) => i.feedType === target)
  }, [aggregatedFeed?.items, activeType])

  return (
    <div className="flex flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <div className="hidden lg:block lg:w-64 lg:shrink-0 lg:pl-6 lg:pt-6">
        <FeedSidebar />
      </div>

      {/* Main stream */}
      <div className="flex-1 min-w-0">
        <FeedFilterBar />

        <div className="px-4 sm:px-6 py-4 lg:py-6 max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 pb-4 mb-5 border-b border-border/40">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>
                Revoluzion Feeds
              </h1>
              <p className="text-text-muted text-xs sm:text-sm mt-1">
                Real-time activity from members, builds, events, and the marketplace
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary border border-primary/30 bg-primary/5 rounded-full px-2.5 py-1 shrink-0">
              <Radio size={11} className="animate-pulse" />
              Live
            </div>
          </div>

          {activeType === 'all' && user && (
            <FeedComposer currentUserId={user.id} avatarUrl={profile?.avatar_url} displayName={profile?.display_name} />
          )}

          {isLoading ? (
            <FeedSkeleton />
          ) : filteredFeed.length === 0 ? (
            <div className="text-center py-20 text-text-muted bg-surface/10 border border-border rounded-xl">
              <Radio size={40} className="mx-auto mb-3 text-primary/20 animate-pulse" />
              <p className="font-semibold text-white uppercase text-xs tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>
                Timeline silent
              </p>
              <p className="text-xs max-w-xs mx-auto leading-relaxed mt-1">
                No activities under this filter yet. Post something to start the stream!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFeed.map((item) =>
                item.feedType === 'post' ? (
                  <PostCard
                    key={item.id}
                    post={{
                      id: item.id,
                      user_id: item.user_id,
                      content: item.content,
                      image_url: item.image_url,
                      likes_count: item.likes_count ?? 0,
                      comments_count: item.comments_count ?? 0,
                      created_at: item.created_at,
                      updated_at: item.updated_at,
                      user: {
                        username: item.metadata.username ?? null,
                        display_name: item.metadata.display_name ?? null,
                        avatar_url: item.metadata.avatar_url ?? null,
                        is_verified: item.metadata.is_verified ?? false,
                      },
                    }}
                    currentUserId={userId}
                    topComment={commentMap[item.id]}
                    initialLiked={likedSet.has(item.id)}
                  />
                ) : (
                  <ActivityCard key={item.id} item={item} currentUserId={userId} />
                ),
              )}
            </div>
          )}
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 z-40 w-11 h-11 rounded-full bg-primary/15 border border-primary/40 text-primary backdrop-blur-md hover:bg-primary/25 transition-colors shadow-[0_4px_24px_rgba(6,182,212,0.35)] flex items-center justify-center animate-fade-in"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-white/6 bg-gradient p-4 sm:p-5 animate-pulse">
          <div className="flex gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-surface-variant" />
            <div className="flex-1">
              <div className="h-3.5 bg-surface-variant rounded w-32 mb-2" />
              <div className="h-2 bg-surface-variant rounded w-20" />
            </div>
          </div>
          <div className="h-3 bg-surface-variant rounded w-full mb-2" />
          <div className="h-3 bg-surface-variant rounded w-3/4 mb-4" />
          <div className="h-40 sm:h-56 bg-surface-variant rounded-lg" />
        </div>
      ))}
    </div>
  )
}
