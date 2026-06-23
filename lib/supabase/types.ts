export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          company_name: string | null
          bio: string | null
          avatar_url: string | null
          location: string | null
          phone: string | null
          is_verified: boolean
          role: string
          shop_role: string | null
          dealer_tier: string | null
          stripe_customer_id: string | null
          followers_count: number
          following_count: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      ,
      users: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          company_name: string | null
          bio: string | null
          avatar_url: string | null
          location: string | null
          phone: string | null
          is_verified: boolean
          role: string
          shop_role: string | null
          dealer_tier: string | null
          stripe_customer_id: string | null
          followers_count: number
          following_count: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Row']>
      }
      cars: {
        Row: {
          id: string
          user_id: string
          make: string
          model: string
          year: number | null
          color: string | null
          image_url: string | null
          car_bio: string | null
          engine: string | null
          likes_count: number
          views: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['cars']['Row'], 'id' | 'created_at' | 'likes_count' | 'views'>
        Update: Partial<Database['public']['Tables']['cars']['Row']>
      }
      events: {
        Row: {
          id: string
          user_id: string
          title: string
          category: string | null
          date: string | null
          time: string | null
          location: string | null
          state: string | null
          price: number
          attendees: number
          banner_url: string | null
          status: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'attendees'>
        Update: Partial<Database['public']['Tables']['events']['Row']>
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          image_url: string | null
          likes_count: number
          comments_count: number
          car_id: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['posts']['Row'], 'id' | 'created_at' | 'likes_count' | 'comments_count'>
        Update: Partial<Database['public']['Tables']['posts']['Row']>
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          parent_id: string | null
          image_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['post_comments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['post_comments']['Row']>
      }
      post_likes: {
        Row: { post_id: string; user_id: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['post_likes']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['post_likes']['Row']>
      }
      builds: {
        Row: {
          id: string
          user_id: string
          car_id: string | null
          title: string
          description: string | null
          image_url: string | null
          mods: string[] | null
          likes_count: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['builds']['Row'], 'id' | 'created_at' | 'likes_count'>
        Update: Partial<Database['public']['Tables']['builds']['Row']>
      }
      marketplace_listings: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          price: number
          category: string | null
          condition: string
          location: string | null
          status: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['marketplace_listings']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['marketplace_listings']['Row']>
      }
      marketplace_images: {
        Row: { id: string; listing_id: string; image_url: string; sort_order: number; created_at: string }
        Insert: Omit<Database['public']['Tables']['marketplace_images']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['marketplace_images']['Row']>
      }
      vehicle_listings: {
        Row: {
          id: string
          user_id: string
          title: string
          make: string | null
          model: string | null
          year: number | null
          mileage: number | null
          price: number
          transmission: string | null
          location: string | null
          description: string | null
          image_url: string | null
          status: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['vehicle_listings']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['vehicle_listings']['Row']>
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          message: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['chat_messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['chat_messages']['Row']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string | null
          type: string
          is_read: boolean
          image_url: string | null
          target_id: string | null
          target_type: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Row']>
      }
      activity_feed: {
        Row: {
          id: string
          user_id: string | null
          type: string
          title: string
          body: string | null
          image_url: string | null
          target_id: string | null
          target_type: string | null
          is_visible: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['activity_feed']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['activity_feed']['Row']>
      }
      follows: {
        Row: { id: string; follower_id: string; following_id: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['follows']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['follows']['Row']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Convenience row types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Car = Database['public']['Tables']['cars']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type PostComment = Database['public']['Tables']['post_comments']['Row']
export type Build = Database['public']['Tables']['builds']['Row']
export type MarketplaceListing = Database['public']['Tables']['marketplace_listings']['Row']
export type VehicleListing = Database['public']['Tables']['vehicle_listings']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type ActivityFeedItem = Database['public']['Tables']['activity_feed']['Row']
export type Follow = Database['public']['Tables']['follows']['Row']

export type PostWithProfile = Post & { users: User | null }
export type BuildWithProfile = Build & { users: User | null; cars: Car | null }
export type MarketplaceListingWithProfile = MarketplaceListing & { users: User | null; marketplace_images: { image_url: string }[] }
export type EventWithProfile = Event & { users: User | null }
export type CommentWithProfile = PostComment & { users: User | null }

// New aliases for renamed table
export type User = Database['public']['Tables']['users']['Row']
export type PostWithUser = Post & { users: User | null }
export type BuildWithUser = Build & { users: User | null; cars: Car | null }
export type MarketplaceListingWithUser = MarketplaceListing & { users: User | null; marketplace_images: { image_url: string }[] }
export type EventWithUser = Event & { users: User | null }
export type CommentWithUser = PostComment & { users: User | null }
