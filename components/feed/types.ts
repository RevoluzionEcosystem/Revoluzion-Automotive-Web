export type FeedType = 'post' | 'car' | 'build' | 'event' | 'listing' | 'service' | 'user'

export interface FeedItemMetadata {
  title?: string
  make?: string
  model?: string
  year?: number | string
  location?: string
  price?: number | string
  category?: string
  condition?: string
  mods?: string[]
  username?: string
  display_name?: string
  avatar_url?: string
  is_verified?: boolean
}

export interface FeedItem {
  id: string
  feedType: FeedType
  created_at: string
  updated_at?: string
  user_id: string
  content: string
  image_url: string | null
  likes_count?: number
  comments_count?: number
  metadata: FeedItemMetadata
}

export interface FeedUser {
  username: string | null
  display_name: string | null
  avatar_url: string | null
  is_verified?: boolean
}

export interface TopComment {
  content: string
  users: FeedUser | null
}

export interface PostCardData {
  id: string
  user_id: string
  content: string
  image_url: string | null
  likes_count: number
  comments_count: number
  created_at: string
  updated_at?: string | null
  user: FeedUser
}

/** Returns true when a record was edited long after its creation (5s threshold). */
export function wasEdited(item: { created_at: string; updated_at?: string | null }): boolean {
  if (!item.updated_at) return false
  return Math.abs(new Date(item.updated_at).getTime() - new Date(item.created_at).getTime()) > 5000
}

// ── Anti-spam: max 3 posts in any 60-second window (client-side guard) ──────
const POST_SPAM_WINDOW_MS = 60_000
const POST_SPAM_MAX = 3
const postTimestamps: number[] = []

export function checkPostSpam(): string | null {
  const now = Date.now()
  while (postTimestamps.length > 0 && now - postTimestamps[0] > POST_SPAM_WINDOW_MS) {
    postTimestamps.shift()
  }
  if (postTimestamps.length >= POST_SPAM_MAX) {
    const wait = Math.ceil((POST_SPAM_WINDOW_MS - (now - postTimestamps[0])) / 1000)
    return `Too many posts. Wait ${wait}s.`
  }
  postTimestamps.push(now)
  return null
}

/** Supabase returns a related row as either an object or a single-element array. */
export function pickUser<T extends FeedUser>(u: T | T[] | null): T | null {
  if (!u) return null
  return Array.isArray(u) ? (u[0] ?? null) : u
}
