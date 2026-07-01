'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, useRouter } from 'next/navigation'
import { ArrowLeft, Heart, Wrench, Edit3, Trash2, X, Plus, Loader2, UploadCloud, Car as CarIcon } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface ClientProps {
  buildId: string
}

export default function IndividualBuildDetailsClient({ buildId }: ClientProps) {
  const supabase = createClient()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  
  // Editing State
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    image_url: '',
    mods: '',
    images: [] as string[],
    youtube_url: ''
  })
  const [uploading, setUploading] = useState(false)

  // 1. Fetch current authenticating user
  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
      return user
    }
  })

  // 2. Fetch specific build details
  const { data: build, isLoading, error } = useQuery({
    queryKey: ['build-detail', buildId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('builds')
        .select('*, users(id, username, display_name, avatar_url, is_verified), cars(id, make, model, year, color, image_url)')
        .eq('id', buildId)
        .single()
      if (error) throw error
      return data
    }
  })
  // Real-time auth sync to ensure currentUserId is always present immediately on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUserId(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])
  // Pre-fill specs form when edit starts
  useEffect(() => {
    if (build) {
      setEditForm({
        title: build.title || '',
        description: build.description || '',
        image_url: build.image_url || '',
        mods: build.mods ? build.mods.join(', ') : '',
        images: build.images || (build.image_url ? [build.image_url] : []),
        youtube_url: build.youtube_url || ''
      })
    }
  }, [build, isEditing])

  // Save Build mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId || currentUserId !== build?.user_id) throw new Error('Unauthorized')
      
      const modsArray = editForm.mods
        .split(/[,\n]/)
        .map(m => m.trim())
        .filter(Boolean)

      if (editForm.images.length > 10) {
        throw new Error('You can upload a maximum of 10 images per build log.')
      }

      const { error } = await supabase
        .from('builds')
        .update({
          title: editForm.title.trim(),
          description: editForm.description.trim() || null,
          image_url: editForm.image_url.trim() || null,
          images: editForm.images,
          youtube_url: editForm.youtube_url.trim() || null,
          mods: modsArray.length > 0 ? modsArray : null
        })
        .eq('id', buildId)

      if (error) throw error
    },
    onSuccess: () => {
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ['build-detail', buildId] })
      toast.success('Build details updated! 🛠️')
    },
    onError: (err: any) => {
      toast.error('Failed to update build', { description: err.message })
    }
  })

  // Delete Build mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId || currentUserId !== build?.user_id) throw new Error('Unauthorized')
      const { error } = await supabase
        .from('builds')
        .delete()
        .eq('id', buildId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['explore-builds-list'] })
      queryClient.invalidateQueries({ queryKey: ['car-related-builds'] })
      toast.success('Build log deleted successfully 🗑️')
      router.push('/garage/builds')
    },
    onError: (err: any) => {
      toast.error('Failed to delete build', { description: err.message })
    }
  })

  // Handle multiple build image upload (Up to 10)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0 || !user) return

    const currentCount = editForm.images.length
    if (currentCount + files.length > 10) {
      toast.error('Limit exceeded 🚫', { description: 'You can upload a maximum of 10 images per build log.' })
      return
    }

    setUploading(true)
    const toastId = toast.loading('Uploading build photographs...')
    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}_build_detail_${i}.${fileExt}`
        const storagePath = `builds/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('garage_media')
          .upload(storagePath, file, { cacheControl: '31536000', upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('garage_media')
          .getPublicUrl(storagePath)

        if (publicUrl) {
          uploadedUrls.push(publicUrl)
        }
      }

      if (uploadedUrls.length > 0) {
        setEditForm(prev => ({
          ...prev,
          image_url: prev.image_url || uploadedUrls[0],
          images: [...prev.images, ...uploadedUrls]
        }))
        toast.success(`Uploaded ${uploadedUrls.length} build photographs! 📸`, { id: toastId })
      }
    } catch (err: any) {
      toast.error('Image upload failed', { id: toastId, description: err.message })
    } finally {
      setUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-text-muted">
        <Loader2 className="animate-spin h-8 w-8 text-primary mb-3" />
        <p className="text-sm font-semibold tracking-wide">Loading build profile...</p>
      </div>
    )
  }

  if (error || !build) {
    notFound()
  }

  const profile = build.users
  const car = build.cars
  const isOwner = user && currentUserId === build.user_id

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/garage/builds" className="inline-flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors text-sm">
          <ArrowLeft size={16} /> Back to Builds
        </Link>
        
        {isOwner && !isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-primary border border-primary/30 hover:bg-primary/5 rounded-lg px-3 py-1.5 transition-all uppercase cursor-pointer"
            >
              <Edit3 size={13} /> Edit Build entry
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to permanently delete this Build Log entry?')) {
                  deleteMutation.mutate()
                }
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-error border border-error/30 hover:bg-error/5 rounded-lg px-3 py-1.5 transition-all uppercase cursor-pointer"
            >
              <Trash2 size={13} /> Delete Build
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate() }} className="card p-6 space-y-5 text-left border border-primary/20 animate-fade-in bg-surface">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h2 className="text-base font-bold text-white uppercase tracking-wider style-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
              📝 Edit Build Journal entry
            </h2>
            <button type="button" onClick={() => setIsEditing(false)} className="text-text-muted hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-text-muted mb-1.5 uppercase font-bold">Journal Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="e.g., Dyno Tune & Stage 2 Fueling Setup"
                  required
                  className="input text-xs w-full bg-background"
                />
              </div>

              <div>
                <label className="block text-[10px] text-text-muted mb-1.5 uppercase font-bold">YouTube Video Link</label>
                <input
                  type="url"
                  value={editForm.youtube_url}
                  onChange={(e) => setEditForm(prev => ({ ...prev, youtube_url: e.target.value }))}
                  placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  className="input text-xs w-full bg-background"
                />
              </div>

              <div>
                <label className="block text-[10px] text-text-muted mb-1.5 uppercase font-bold">Description / Story / Dyno Logs</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Tell the community about what you did, the parts installed, and the setup results..."
                  className="input text-xs w-full bg-background min-h-32"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-text-muted mb-1.5 uppercase font-bold">Modifications (Comma or newline separated)</label>
                <textarea
                  value={editForm.mods}
                  onChange={(e) => setEditForm({ ...editForm, mods: e.target.value })}
                  placeholder="e.g., Stage 2 fuel injectors, 3-inch high-flow downpipe, custom mapping"
                  className="input text-xs w-full bg-background min-h-24"
                />
              </div>

              <div>
                <label className="block text-[10px] text-text-muted mb-1.5 uppercase font-bold">Build Feature Photos (Up to 10)</label>
                <div className="flex flex-col gap-2.5">
                  {editForm.images && editForm.images.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 border border-border p-2 rounded-lg bg-black/40">
                      {editForm.images.map((imgUrl, i) => (
                        <div key={i} className="relative aspect-square rounded overflow-hidden group">
                          <Image src={imgUrl} alt="" fill className="object-cover" />
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => {
                              const u = prev.images.filter(x => x !== imgUrl);
                              return {
                                ...prev,
                                images: u,
                                image_url: prev.image_url === imgUrl ? (u[0] || '') : prev.image_url
                              };
                            })}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-error transition-all"
                          >
                            <X size={12} className="stroke-[3]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editForm.image_url}
                      onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                      placeholder="Cover Image URL or upload below..."
                      className="input text-xs flex-1 bg-background"
                    />
                    <label className="btn-primary py-2 px-3.5 text-xs flex items-center justify-center cursor-pointer shrink-0">
                      {uploading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <UploadCloud size={13} />
                      )}
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end border-t border-border/40 pt-4">
            <button type="submit" disabled={saveMutation.isPending} className="btn-primary py-2 px-5 text-xs font-bold">
              {saveMutation.isPending ? 'Saving...' : 'Save Updates'}
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className="btn-ghost py-2 px-5 text-xs font-bold">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Photos Swipeable Carousel or simple hero grid */}
          {build.images && build.images.length > 0 ? (
            <div className="relative w-full aspect-video md:max-h-[480px] rounded-2xl overflow-hidden mb-6 border border-border bg-black group select-none flex items-center justify-center">
              {/* Blurred depth underlay */}
              <div 
                className="absolute inset-0 bg-cover bg-center filter blur-md opacity-20 scale-102 pointer-events-none transition-all duration-300"
                style={{ backgroundImage: `url(${build.images[activeImageIdx || 0]})` }}
              />

              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={build.images[activeImageIdx || 0]}
                  alt={build.title}
                  fill
                  className="object-contain w-full h-full transition-opacity duration-300"
                  sizes="(max-width: 1200px) 100vw, 1000px"
                  priority
                />
              </div>

              {/* Left Carousel Arrow */}
              {build.images.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveImageIdx(prev => (prev === 0 ? build.images.length - 1 : prev - 1))}
                  className="absolute left-4 p-2.5 rounded-full bg-black/60 hover:bg-black/95 text-white backdrop-blur border border-white/10 opacity-0 group-hover:opacity-100 transition-all z-10 cursor-pointer active:scale-95"
                >
                  &lt;
                </button>
              )}

              {/* Right Carousel Arrow */}
              {build.images.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveImageIdx(prev => (prev === build.images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 p-2.5 rounded-full bg-black/60 hover:bg-black/95 text-white backdrop-blur border border-white/10 opacity-0 group-hover:opacity-100 transition-all z-10 cursor-pointer active:scale-95"
                >
                  &gt;
                </button>
              )}

              {/* Slide Counter Overlay Badge */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur px-3 py-1 rounded-full border border-white/10 text-[9px] font-mono font-bold text-white tracking-widest z-10 flex items-center gap-1.5 leading-none">
                <span>PHOTO</span>
                <span className="text-primary font-black">{(activeImageIdx || 0) + 1}</span>
                <span className="text-white/35">/</span>
                <span>{build.images.length}</span>
              </div>
            </div>
          ) : build.image_url ? (
            <div className="rounded-2xl overflow-hidden mb-6 border border-border/80 relative aspect-video w-full max-h-[480px]">
              <Image
                src={build.image_url}
                alt={build.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : null}

          <div className="grid lg:grid-cols-3 gap-8 text-left">
            <div className="lg:col-span-2 space-y-6">
              {/* Title Header */}
              <div>
                {car && (
                  <Link href={`/garage/${car.id}`} className="badge-primary mb-3 inline-flex items-center gap-1 hover:brightness-110 cursor-pointer">
                    <Wrench size={12} /> {car.year} {car.make} {car.model}
                  </Link>
                )}
                <h1 className="text-3xl font-black gradient-text mb-3 tracking-wide style-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                  {build.title}
                </h1>

                {/* Builder Row */}
                {profile && (
                  <Link href={`/u/${profile.username}`} className="inline-flex items-center gap-2.5 text-sm text-text-muted hover:text-text-secondary transition-colors">
                    {profile.avatar_url ? (
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10">
                        <Image src={profile.avatar_url} alt="" fill className="object-cover" />
                      </div>
                    ) : (
                      <DefaultAvatar className="w-8 h-8" />
                    )}
                    <span>Built by</span>
                    <span className="text-text-primary font-bold">{profile.display_name || profile.username}</span>
                    <span className="text-text-disabled">· {timeAgo(build.created_at)}</span>
                  </Link>
                )}
              </div>

              {build.description && (
                <div className="card p-6 bg-surface border border-border rounded-2xl">
                  <h2 className="font-extrabold text-white text-sm uppercase tracking-wider style-orbitron mb-4" style={{ fontFamily: 'var(--font-orbitron)' }}>
                    About this build
                  </h2>
                  <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">{build.description}</p>
                </div>
              )}

              {/* YouTube Embed Video Panel */}
              {build.youtube_url && (
                <div className="card p-6 bg-surface border border-border rounded-2xl space-y-4">
                  <h2 className="font-extrabold text-white text-sm uppercase tracking-wider style-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                    📹 Video Demonstration
                  </h2>
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-black">
                    {(() => {
                      let embedSrc = build.youtube_url
                      try {
                        const parsed = new URL(build.youtube_url)
                        let videoId = ''
                        if (parsed.hostname.includes('youtu.be')) {
                          videoId = parsed.pathname.substring(1)
                        } else {
                          videoId = parsed.searchParams.get('v') || ''
                        }
                        embedSrc = `https://www.youtube.com/embed/${videoId}`
                      } catch (_) {}

                      return (
                        <iframe
                          src={embedSrc}
                          title="YouTube video player"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full border-0"
                        />
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Mods list */}
              {build.mods && build.mods.length > 0 && (
                <div className="card p-6 bg-surface border border-border rounded-2xl">
                  <h2 className="font-extrabold text-white text-sm uppercase tracking-wider style-orbitron mb-4" style={{ fontFamily: 'var(--font-orbitron)' }}>
                    Modifications List
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {build.mods.map((mod: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 bg-black/40 border border-border/80 px-4 py-2.5 rounded-xl text-xs text-text-primary font-medium hover:border-white/15 transition-all">
                        <span className="text-primary font-black">&bull;</span>
                        <span>{mod}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar with vehicle stats */}
            {car && (
              <div className="space-y-6">
                <div className="card p-5 bg-surface border border-border rounded-2xl space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider style-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                    Vehicle Specifications
                  </h3>
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-border/60 bg-[#0e1017]">
                    {car.image_url ? (
                      <Image src={car.image_url} alt="" fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <CarIcon size={32} className="text-slate-700" />
                      </div>
                    )}
                  </div>

                  <Link href={`/garage/${car.id}`} className="block text-center w-full py-2 bg-primary/10 border border-primary/20 hover:bg-primary text-primary hover:text-black font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all">
                    View Master Garage Profile
                  </Link>

                  <div className="border-t border-border/60 my-2" />

                  <dl className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <dt className="text-text-muted">Make</dt>
                      <dd className="font-bold text-white">{car.make}</dd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <dt className="text-text-muted">Model</dt>
                      <dd className="font-bold text-white">{car.model}</dd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <dt className="text-text-muted">Year</dt>
                      <dd className="font-bold text-white">{car.year ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <dt className="text-text-muted">Color</dt>
                      <dd className="font-bold text-white capitalize">{car.color ? car.color.toLowerCase() : '—'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}