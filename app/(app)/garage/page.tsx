'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Car, Search, Heart, Eye, Calendar, Palette, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { GarageSidebar } from '@/components/ui/GarageSidebar'

interface CarLike {
  car_id: string
}

export default function ExploreCarsPage() {
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

  // 2. Fetch all cars in the public directory with joined user metadata and likes
  const { data: cars = [], isLoading } = useQuery({
    queryKey: ['explore-cars-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cars')
        .select('*, users!cars_user_id_fkey(id, username, display_name, avatar_url, is_verified)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    }
  })

  // 3. Fetch list of car ids currently liked by current user
  const { data: userLikedCarIds = [] } = useQuery({
    queryKey: ['user-liked-cars', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data } = await supabase
        .from('car_likes')
        .select('car_id')
        .eq('user_id', user.id)
      return (data ?? []).map((like: CarLike) => like.car_id)
    },
    enabled: !!user?.id
  })

  // 4. Toggle Like Mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async (carId: string) => {
      if (!user?.id) {
        toast.error('Sign in required 🔒', { description: 'Please log in to like this vehicle.' })
        return
      }

      const isInitiallyLiked = userLikedCarIds.includes(carId)
      if (isInitiallyLiked) {
        // Delete like
        await supabase
          .from('car_likes')
          .delete()
          .eq('car_id', carId)
          .eq('user_id', user.id)
      } else {
        // Insert like
        await supabase
          .from('car_likes')
          .insert({ car_id: carId, user_id: user.id })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['explore-cars-list'] })
      queryClient.invalidateQueries({ queryKey: ['user-liked-cars', user?.id] })
      toast.success('Favorites updated! ❤️')
    }
  })

  // Filter cars based on Make, Model, Color, or Engine codes
  const filteredCars = cars.filter((car) => {
    const q = search.toLowerCase()
    return (
      car.make.toLowerCase().includes(q) ||
      car.model.toLowerCase().includes(q) ||
      (car.color?.toLowerCase() ?? '').includes(q) ||
      (car.engine?.toLowerCase() ?? '').includes(q) ||
      (car.users?.display_name?.toLowerCase() ?? '').includes(q) ||
      (car.users?.username?.toLowerCase() ?? '').includes(q)
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
            <h1 className="text-2xl font-semibold gradient-text" style={{ fontFamily: 'var(--font-orbitron)', fontWeight: 600 }}>Explore Garages</h1>
            <p className="text-text-muted text-sm mt-1">Discover customized vehicles, bimetallic specs, and community build sheets</p>
          </div>

          {/* Diagnostic Search Box */}
          <div className="relative w-full md:w-80">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 text-xs py-2.5 rounded-xl border border-border bg-black text-white w-full"
              placeholder="Search make, model, parts, engine, or builder..."
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card h-90 bg-surface/50 border border-border/40 rounded-2xl" />
            ))}
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="text-center py-20 text-text-muted bg-surface/5 border border-border/60 rounded-2xl">
            <Car size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No results matches your searches</p>
            <p className="text-sm mt-1">Try another search or register your vehicle inside <Link href="/garage/me" className="text-primary hover:underline">My Collection</Link>!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in pb-16">
            {filteredCars.map((car) => {
              const isCarLiked = userLikedCarIds.includes(car.id)
              const author = car.users

              return (
                <div 
                  key={car.id} 
                  onClick={() => router.push(`/garage/${car.id}`)}
                  className="group relative flex flex-col justify-between h-90 rounded-2xl bg-linear-to-b from-[#181d29] to-[#0d1017] border border-white/5 hover:border-white/15 transition-all duration-300 cursor-pointer overflow-hidden text-left"
                >
                  
                  {/* Aspect Ratio Cover Photo Container */}
                  <div className="relative w-full h-45 bg-[#0e1017] overflow-hidden shrink-0">
                    {car.image_url ? (
                      <Image
                        src={car.image_url}
                        alt={`${car.make} ${car.model}`}
                        fill
                        className="object-cover group-hover:scale-103 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    ) : (
                      // Futuristic wireframe vector blueprint fallback
                      <div className="absolute inset-0 bg-[#0e1017] flex flex-col items-center justify-center overflow-hidden select-none">
                        <Car size={40} className="text-slate-700 group-hover:text-primary/20 transition-colors duration-500" />
                      </div>
                    )}

                    {/* Top Right Floating Like Button Overlay (Pill style with heart icon) */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleLikeMutation.mutate(car.id)
                      }}
                      className="absolute top-3 right-3 py-1 px-2.5 rounded-full border border-white/10 bg-black/60 backdrop-blur-sm flex items-center gap-1 text-[10px] font-bold font-mono text-white transition-all z-10 hover:border-white/30"
                    >
                      <Heart size={11} fill={isCarLiked ? '#ef4444' : 'none'} className={`text-white transition-colors ${isCarLiked ? 'text-error' : ''}`} />
                      <span>{car.likes_count ?? 0}</span>
                    </button>
                  </div>

                  {/* Card Details specs list body */}
                  <div className="p-4 flex-1 flex flex-col justify-between min-w-0 bg-transparent">
                    
                    <div className="space-y-1.5 min-w-0">
                      {/* Make + Model Heading */}
                      <div>
                        <h3 
                          className="text-[17px] font-bold text-white leading-snug truncate" 
                          title={`${car.make} ${car.model}`}
                          style={{ fontFamily: 'var(--font-inter), sans-serif' }}
                        >
                          {car.make} {car.model}
                        </h3>
                      </div>

                      {/* Calendar (Year) & Color Rows inside sub-block */}
                      <div className="space-y-1 text-[13px] text-slate-400 font-medium leading-none">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-[#475569] shrink-0" />
                          <span>{car.year ?? '—'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Palette size={13} className="text-[#475569] shrink-0" />
                          <span className="capitalize">{car.color ? car.color.toLowerCase() : '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div className="pt-3 flex items-center justify-between text-xs font-medium border-0">
                      
                      {/* Left side: User icon + display name */}
                      {author && (
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2 text-slate-400">
                          <User size={13} className="text-[#475569] shrink-0" />
                          <span className="truncate leading-none">
                            {author.display_name || author.username}
                          </span>
                        </div>
                      )}

                      {/* Right side: Views & Likes icons with counts */}
                      <div className="flex items-center gap-3 shrink-0 text-slate-400 font-mono leading-none">
                        <span className="flex items-center gap-1" title="Views">
                          <Eye size={13} className="text-[#475569]" />
                          <span>{car.views ?? 0}</span>
                        </span>
                        <span className="flex items-center gap-1" title="Likes">
                          <Heart size={12} className="text-error fill-error stroke-error" />
                          <span>{car.likes_count ?? 0}</span>
                        </span>
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
