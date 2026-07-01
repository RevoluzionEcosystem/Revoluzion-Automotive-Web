'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Wrench, Heart, Search, Eye, Calendar, User, ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { GarageSidebar } from '../GarageSidebar'
import type { BuildWithUser } from '@/lib/supabase/types'

export default function BuildsPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [search, setSearch] = useState('')

  // 1. Get current user session
  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    }
  })

  // 2. Fetch all builds from the database with related users and cars
  const { data: builds = [], isLoading } = useQuery({
    queryKey: ['explore-builds-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('builds')
        .select('*, users(username, display_name, avatar_url, is_verified), cars(make, model, year)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as BuildWithUser[]
    }
  })

  // 3. Fetch list of build ids currently liked by current user (if exists in your schema)
  // Assuming build_likes might exist similarly but to be safe we can use the build's local likes_count or standard state
  const { data: userLikedBuildIds = [] } = useQuery({
    queryKey: ['user-liked-builds', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data } = await supabase
        .from('build_likes')
        .select('build_id')
        .eq('user_id', user.id)
      return (data ?? []).map((like: any) => like.build_id)
    },
    enabled: !!user?.id,
    retry: false, // If build_likes table doesn't exist, fail gracefully
  })

  // 4. Toggle Like Mutation (handles fallback if build_likes schema doesn't support it)
  const toggleLikeMutation = useMutation({
    mutationFn: async (buildId: string) => {
      if (!user?.id) {
        toast.error('Sign in required 🔒', { description: 'Please log in to like this build.' })
        return
      }

      try {
        const isInitiallyLiked = userLikedBuildIds.includes(buildId)
        if (isInitiallyLiked) {
          await supabase
            .from('build_likes')
            .delete()
            .eq('build_id', buildId)
            .eq('user_id', user.id)
        } else {
          await supabase
            .from('build_likes')
            .insert({ build_id: buildId, user_id: user.id })
        }
      } catch (err) {
        // Fallback or skip if table doesn't exist
        throw new Error('Likes are currently disabled for builds or database mismatch.')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['explore-builds-list'] })
      queryClient.invalidateQueries({ queryKey: ['user-liked-builds', user?.id] })
      toast.success('Favorites updated! ❤️')
    },
    onError: (err: any) => {
      toast.error('Could not update likes', { description: err.message })
    }
  })

  const filteredBuilds = builds.filter((build) => {
    const q = search.toLowerCase()
    const buildCar = build.cars
    const carModelName = buildCar ? `${buildCar.make} ${buildCar.model}`.toLowerCase() : ''
    return (
      build.title.toLowerCase().includes(q) ||
      (build.description?.toLowerCase() ?? '').includes(q) ||
      carModelName.includes(q) ||
      (build.users?.display_name?.toLowerCase() ?? '').includes(q) ||
      (build.users?.username?.toLowerCase() ?? '').includes(q)
    )
  })

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6">
      {/* Unified Left Sidebar */}
      <GarageSidebar />

      {/* Right Main Interface */}
      <main className="flex-1 min-w-0 space-y-6">
        
        {/* Title Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
          <div>
            <h1 className="text-2xl font-semibold gradient-text" style={{ fontFamily: 'var(--font-orbitron)', fontWeight: 600 }}>Build Logs</h1>
            <p className="text-text-muted text-sm mt-1">Discover development histories, mechanical specifications, and dyno-proven modification charts</p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 text-xs py-2.5 rounded-xl border border-border bg-black text-white w-full"
              placeholder="Search builds, parts, car specs, or users..."
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card h-90 bg-surface/50 border border-border/40 rounded-2xl" />
            ))}
          </div>
        ) : filteredBuilds.length === 0 ? (
          <div className="text-center py-20 text-text-muted bg-surface/5 border border-border/60 rounded-2xl">
            <Wrench size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No build logs matches your search</p>
            <p className="text-sm mt-1">Try another search or register your vehicle inside <Link href="/garage/me" className="text-primary hover:underline">My Collection</Link>!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in pb-16">
            {filteredBuilds.map((build) => {
              const isBuildLiked = userLikedBuildIds.includes(build.id)
              const author = build.users
              const car = build.cars

              return (
                <div 
                  key={build.id} 
                  onClick={() => router.push(`/garage/builds/${build.id}`)}
                  className="group relative flex flex-col justify-between h-90 rounded-2xl bg-linear-to-b from-[#181d29] to-[#0d1017] border border-white/5 hover:border-white/15 transition-all duration-300 cursor-pointer overflow-hidden text-left"
                >
                  
                  {/* Aspect Ratio Cover Photo Container */}
                  <div className="relative w-full h-45 bg-[#0e1017] overflow-hidden shrink-0">
                    {build.image_url ? (
                      <Image
                        src={build.image_url}
                        alt={build.title}
                        fill
                        className="object-cover group-hover:scale-103 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[#0e1017] flex flex-col items-center justify-center overflow-hidden select-none">
                        <Wrench size={40} className="text-slate-700 group-hover:text-primary/20 transition-colors duration-500" />
                      </div>
                    )}

                    {/* Top Right Floating Like Button Overlay */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleLikeMutation.mutate(build.id)
                      }}
                      className="absolute top-3 right-3 py-1 px-2.5 rounded-full border border-white/10 bg-black/60 backdrop-blur-sm flex items-center gap-1 text-[10px] font-bold font-mono text-white transition-all z-10 hover:border-white/30"
                    >
                      <Heart size={11} fill={isBuildLiked ? '#ef4444' : 'none'} className={`text-white transition-colors ${isBuildLiked ? 'text-error' : ''}`} />
                      <span>{build.likes_count ?? 0}</span>
                    </button>
                  </div>

                  {/* Card Details body */}
                  <div className="p-4 flex-1 flex flex-col justify-between min-w-0 bg-transparent">
                    
                    <div className="space-y-1.5 min-w-0">
                      {/* Car Badge Link */}
                      {car && (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-primary font-bold tracking-tight">
                          <span>{car.year}</span>
                          <span>•</span>
                          <span className="truncate">{car.make} {car.model}</span>
                        </div>
                      )}

                      {/* Build Title */}
                      <div>
                        <h3 
                          className="text-[15px] font-bold text-white leading-snug line-clamp-2" 
                          title={build.title}
                          style={{ fontFamily: 'var(--font-inter), sans-serif' }}
                        >
                          {build.title}
                        </h3>
                      </div>

                      {/* Build Description summary */}
                      {build.description && (
                        <p className="text-[12px] text-slate-400 line-clamp-2 leading-relaxed">
                          {build.description}
                        </p>
                      )}
                    </div>

                    {/* Footer Row */}
                    <div className="pt-3 flex items-center justify-between text-xs font-medium border-0">
                      
                      {/* Left side: User Profile display name */}
                      {author && (
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2 text-slate-400">
                          <User size={13} className="text-[#475569] shrink-0" />
                          <span className="truncate leading-none">
                            {author.display_name || author.username}
                          </span>
                        </div>
                      )}

                      {/* Right side: Likes and Arrow indicators */}
                      <div className="flex items-center gap-3 shrink-0 text-slate-400 font-mono leading-none">
                        <span className="flex items-center gap-1 text-slate-400" title="Likes">
                          <Heart size={12} className="text-error fill-error stroke-error" />
                          <span>{build.likes_count ?? 0}</span>
                        </span>
                        <ArrowUpRight size={14} className="text-slate-500 group-hover:text-primary transition-colors" />
                      </div>

                    </div>

                  </div>

                </div>
              )
            })}
          </div>
        )}

      </main>
    </div>
  )
}
