import { createClient } from '@/lib/supabase/server'
import { SafeImage } from '@/components/ui/SafeImage'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Users, Shield, MessageSquare, Sparkles, ArrowLeft } from 'lucide-react'
import { formatDate, timeAgo } from '@/lib/utils'
import type { Metadata } from 'next'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { ClubActionsClient } from './ClubActionsClient'
import { CarClubsSidebar } from '@/components/ui/CarClubsSidebar'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('car_clubs').select('name').eq('id', id).single()
  return { title: `${data?.name ?? 'Club Details'} — Revoluzion` }
}

interface ClubMember {
  user_id: string
  role: string
  joined_at: string
  users: {
    username: string
    display_name?: string
    avatar_url?: string
  }
}

interface ClubPost {
  id: string
  content: string
  image_url?: string
  created_at: string
  user_id: string
  users: {
    username: string
    display_name?: string
    avatar_url?: string
  }
}

export default async function ClubDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Retrieve current user session details
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch the active club record
  const { data: club } = await supabase
    .from('car_clubs')
    .select('*')
    .eq('id', id)
    .single()

  if (!club) notFound()

  // Fetch members associated with this club
  const { data: membersRaw } = await supabase
    .from('car_club_members')
    .select('user_id, role, joined_at, users:user_id(username, display_name, avatar_url)')
    .eq('club_id', id)
    .order('joined_at', { ascending: true })

  const members = (membersRaw as unknown as ClubMember[]) ?? []
  const isMember = user ? members.some((m) => m.user_id === user.id) : false
  const myMemberRecord = user ? members.find((m) => m.user_id === user.id) : null
  const isOwnerOrAdmin = myMemberRecord?.role === 'owner' || myMemberRecord?.role === 'admin'

  // Fetch active communication post streams inside the club
  const { data: postsRaw } = await supabase
    .from('car_club_posts')
    .select('id, content, image_url, created_at, user_id, users:user_id(username, display_name, avatar_url)')
    .eq('club_id', id)
    .order('created_at', { ascending: false })

  const posts = (postsRaw as unknown as ClubPost[]) ?? []

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6">
      {/* Unified Left Sidebar */}
      <CarClubsSidebar />

      {/* Right Main Interface */}
      <main className="flex-1 min-w-0 space-y-6">
        
        {/* Title Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
          <div>
            <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>{club.name}</h1>
            <p className="text-text-muted text-sm mt-1">{club.location || 'Malaysia'} Hub — Founded {formatDate(club.created_at, 'MMMM yyyy')}</p>
          </div>

          <div className="flex gap-2 shrink-0">
            <Link
              href="/car-clubs"
              className="h-9 px-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-transparent text-text-secondary hover:text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              <ArrowLeft size={12} className="stroke-[2.5]" /> Directory
            </Link>
            <ClubActionsClient
              clubId={club.id}
              userId={user?.id}
              isMember={isMember}
              role={myMemberRecord?.role}
            />
          </div>
        </div>

        {/* Banner */}
        <div className="h-48 rounded-2xl bg-gradient-to-br from-primary/20 via-teal/10 to-background relative overflow-hidden border border-slate-800 shadow-xl shrink-0">
          <SafeImage
            src={club.banner_url || ''}
            alt={club.name}
            fill
            className="object-cover opacity-60"
            fallbackSrc="/cover-image/cover-image.jpg"
          />
        </div>

        {/* Club description */}
        {club.description && (
          <div className="p-4 bg-slate-900/30 border border-slate-800/80 rounded-2xl">
            <h4 className="text-[10px] font-black uppercase text-primary tracking-widest mb-1" style={{ fontFamily: 'var(--font-orbitron)' }}>
              About this Community
            </h4>
            <p className="text-text-secondary text-xs leading-relaxed" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
              {club.description}
            </p>
          </div>
        )}

        {/* Club feed section */}
        <div className="space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#8A90A0] flex items-center gap-1.5" style={{ fontFamily: 'var(--font-orbitron)' }}>
              <MessageSquare className="h-4 w-4 text-primary" /> Club Bulletin Board
            </h2>
          </div>

          {!isMember ? (
            <div className="p-8 rounded-2xl bg-[#14171E] border border-slate-800/80 text-center text-text-muted space-y-2">
              <Shield size={24} className="mx-auto text-primary/30" />
              <p className="text-xs font-bold uppercase tracking-wider text-text-primary" style={{ fontFamily: 'var(--font-orbitron)' }}>
                Member Board Protected
              </p>
              <p className="text-[11px] max-w-sm mx-auto leading-relaxed">
                Posts and announcements on this board are restricted to active club members. Join the club above to start chatting with other members!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Write a Post Client block */}
              <ClubActionsClient
                clubId={club.id}
                userId={user?.id}
                isMember={isMember}
                role={myMemberRecord?.role}
                writePostOnly
              />

              {/* Feed posts stream */}
              {posts.length === 0 ? (
                <div className="p-8 text-center text-text-muted text-xs leading-relaxed border border-slate-800/80 rounded-2xl bg-surface/20">
                  <Sparkles size={20} className="mx-auto text-primary/20 mb-2" />
                  No posts have been made inside this club bulletin yet. Be the first to post!
                </div>
              ) : (
                <div className="space-y-3.5">
                  {posts.map((post) => {
                    return (
                      <div key={post.id} className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl relative group">
                        <div className="flex items-start justify-between gap-2.5">
                          <Link href={`/u/${post.users?.username}`} className="flex items-center gap-2.5">
                            {post.users?.avatar_url ? (
                              <img src={post.users.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-800" />
                            ) : (
                              <div className="w-8 h-8 border border-slate-800 rounded-full flex items-center justify-center bg-surface overflow-hidden">
                                <DefaultAvatar className="w-7 h-7" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-white text-xs leading-none">
                                {post.users?.display_name || post.users?.username}
                              </div>
                              <span className="text-[10px] text-text-disabled block mt-1">
                                {timeAgo(post.created_at)}
                              </span>
                            </div>
                          </Link>

                          {/* Delete Action if my post or I am Owner/Admin */}
                          {(user?.id === post.user_id || isOwnerOrAdmin) && (
                            <ClubActionsClient
                              clubId={club.id}
                              userId={user?.id}
                              isMember={isMember}
                              postId={post.id}
                              deletePostOnly
                            />
                          )}
                        </div>

                        <p className="text-text-secondary text-xs leading-relaxed mt-3 whitespace-pre-wrap" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
                          {post.content}
                        </p>

                        {post.image_url && (
                          <div className="mt-3.5 rounded-lg overflow-hidden border border-slate-900 bg-surface h-72 relative">
                            <SafeImage src={post.image_url} alt="" fill className="object-cover" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
