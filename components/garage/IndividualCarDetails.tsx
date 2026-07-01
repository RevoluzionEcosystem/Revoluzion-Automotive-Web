'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Heart, MessageSquare, ShieldAlert, Wrench, Calendar, Palette, Fuel, Plus, Send, Settings, Eye, ChevronRight, Car, ArrowLeft,
  Flame, ArrowDownUp, Shield, Layers, Sliders, Disc, Loader2, UploadCloud, X, ChevronLeft, Maximize2, Edit3, Trash2
} from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Props {
  carId: string
}

export default function IndividualCarDetails({ carId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'mods' | 'pictures' | 'builds'>('overview')
  const [commentContent, setCommentContent] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Specifications / Overview Editing state
  const [isEditingSpecs, setIsEditingSpecs] = useState(false)
  const [specsForm, setSpecsForm] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
    engine: '',
    cc: '',
    hp: '',
    torque: '',
    car_bio: ''
  })

  // Builds CRUD state
  const [showAddBuildForm, setShowAddBuildForm] = useState(false)
  const [editingBuildId, setEditingBuildId] = useState<string | null>(null)
  const [buildForm, setBuildForm] = useState({
    title: '',
    description: '',
    image_url: '',
    mods: '',
    images: [] as string[],
    youtube_url: ''
  })
  
  // Video embeds input state
  const [embedUrl, setEmbedUrl] = useState('')
  const [submittingEmbed, setSubmittingEmbed] = useState(false)

  // Image gallery states
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [zoomImage, setZoomImage] = useState<string | null>(null)
  const [uploadingGallery, setUploadingGallery] = useState(false)

  // 1. Fetch current authenticating user
  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
      return user
    }
  })

  // 2. Fetch specific car details by ID
  const { data: car, isLoading: isCarLoading } = useQuery({
    queryKey: ['explore-car-detail', carId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cars')
        .select('*, users!cars_user_id_fkey(id, username, display_name, avatar_url, is_verified)')
        .eq('id', carId)
        .single()
      if (error) throw error
      return data
    }
  })

  // 3. Check if user liked this car
  const { data: isLiked = false, refetch: refetchLikeState } = useQuery({
    queryKey: ['car-is-liked', carId, currentUserId],
    queryFn: async () => {
      if (!currentUserId) return false
      const { data } = await supabase
        .from('car_likes')
        .select('id')
        .eq('car_id', carId)
        .eq('user_id', currentUserId)
        .maybeSingle()
      return !!data
    },
    enabled: !!currentUserId
  })

  // 4. Fetch related comments
  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['car-comments', carId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('car_comments')
        .select('*, users!car_comments_user_id_fkey(username, display_name, avatar_url)')
        .eq('car_id', carId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    }
  })

  // 5. Fetch builds related to this car
  const { data: relatedBuilds = [], isLoading: isBuildsLoading } = useQuery({
    queryKey: ['car-related-builds', carId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('builds')
        .select('*, users!builds_user_id_fkey(username, display_name, avatar_url)')
        .eq('car_id', carId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    }
  })

  // Like Toggle Mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) {
        toast.error('Sign in required 🔒', { description: 'Please log in to like this vehicle.' })
        return
      }

      if (isLiked) {
        // Delete like
        await supabase
          .from('car_likes')
          .delete()
          .eq('car_id', carId)
          .eq('user_id', currentUserId)
      } else {
        // Insert like
        await supabase
          .from('car_likes')
          .insert({ car_id: carId, user_id: currentUserId })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['explore-car-detail', carId] })
      refetchLikeState()
      toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites! ❤️')
    }
  })

  // Add Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error('Sign in required')
      const { error } = await supabase
        .from('car_comments')
        .insert({
          car_id: carId,
          user_id: currentUserId,
          content: commentContent.trim()
        })
      if (error) throw error
    },
    onSuccess: () => {
      setCommentContent('')
      refetchComments()
      toast.success('Comment posted successfully! 💬')
    },
    onError: (err: any) => {
      toast.error('Failed to post comment', { description: err.message ?? 'Try again later.' })
    }
  })

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentContent.trim()) return
    addCommentMutation.mutate()
  }

  // Add Video Embed Mutation
  const addVideoMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error('Sign in required')
      
      // Pull existing embeds list
      const currentEmbeds = car?.video_embeds || []
      
      // Clean and push url
      const cleaned = embedUrl.trim()
      if (!cleaned) return

      const updated = [...currentEmbeds, cleaned]

      const { error } = await supabase
        .from('cars')
        .update({ video_embeds: updated })
        .eq('id', carId)

      if (error) throw error
    },
    onSuccess: () => {
      setEmbedUrl('')
      toast.success('Video link embedded successfully! 📹')
      queryClient.invalidateQueries({ queryKey: ['explore-car-detail', carId] })
    },
    onError: (err: any) => {
      toast.error('Could not embed video', { description: err.message ?? 'Try again.' })
    }
  })

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!embedUrl.trim()) return
    addVideoMutation.mutate()
  }

  // Pre-fill specifications edit form on car loaded
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

  useEffect(() => {
    if (car) {
      setSpecsForm({
        make: car.make || '',
        model: car.model || '',
        year: car.year ? String(car.year) : '',
        color: car.color || '',
        engine: car.engine || '',
        cc: car.cc ? String(car.cc) : '',
        hp: car.hp ? String(car.hp) : '',
        torque: car.torque ? String(car.torque) : '',
        car_bio: car.car_bio || ''
      })
    }
  }, [car])

  // Mutation to update general specifications
  const saveSpecsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('cars')
        .update({
          make: specsForm.make.trim(),
          model: specsForm.model.trim(),
          year: specsForm.year ? parseInt(specsForm.year, 10) : null,
          color: specsForm.color.trim() || null,
          engine: specsForm.engine.trim() || null,
          cc: specsForm.cc ? parseInt(specsForm.cc, 10) : null,
          hp: specsForm.hp ? parseInt(specsForm.hp, 10) : null,
          torque: specsForm.torque ? parseInt(specsForm.torque, 10) : null,
          car_bio: specsForm.car_bio.trim() || null
        })
        .eq('id', carId)
      if (error) throw error
    },
    onSuccess: () => {
      setIsEditingSpecs(false)
      queryClient.invalidateQueries({ queryKey: ['explore-car-detail', carId] })
      toast.success('Specifications updated successfully! 🚗')
    },
    onError: (err: any) => {
      errorHandler(err, 'Failed to update specifications')
    }
  })

  const [uploadingCover, setUploadingCover] = useState(false)
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !car) return

    setUploadingCover(true)
    const toastId = toast.loading('Uploading vehicle cover image...')

    try {
      const { compressImage } = await import('@/lib/image-utils')
      let compressedFile = file
      try {
        compressedFile = await compressImage(file, 1920, 0.83)
      } catch (compressErr) {
        console.error('Client compression failed, using original file', compressErr)
      }

      const randUid = Math.random().toString(36).substring(2, 7)
      const path = `cars/${carId}/cover-${Date.now()}-${randUid}.jpg`
      
      const { error: uploadErr } = await supabase.storage.from('user-content').upload(path, compressedFile, {
        upsert: true,
        cacheControl: '31536000'
      })

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage.from('user-content').getPublicUrl(path)
      if (!publicUrl) throw new Error('Could not retrieve public URL')

      const { error: updateErr } = await supabase
        .from('cars')
        .update({ image_url: publicUrl })
        .eq('id', carId)

      if (updateErr) throw updateErr

      queryClient.invalidateQueries({ queryKey: ['explore-car-detail', carId] })
      toast.success('Cover image updated! 📸', { id: toastId })
    } catch (err: any) {
      console.error(err)
      toast.error('Cover upload failed', { id: toastId, description: err.message })
    } finally {
      setUploadingCover(false)
    }
  }

  const selectCoverFromGallery = async (url: string) => {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ image_url: url })
        .eq('id', carId)

      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ['explore-car-detail', carId] })
      toast.success('Cover photo updated! 🌌')
    } catch (err: any) {
      toast.error('Failed to change cover photo', { description: err.message })
    }
  }

  const deleteGalleryImage = async (url: string) => {
    if (!confirm('Are you sure you want to delete this image from your build gallery?')) return
    try {
      const currentGallery = car?.gallery_images || []
      const updatedGallery = currentGallery.filter((img: string) => img !== url)

      const { error } = await supabase
        .from('cars')
        .update({ gallery_images: updatedGallery })
        .eq('id', carId)

      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ['explore-car-detail', carId] })
      toast.success('Image deleted from gallery! 🗑️')
    } catch (err: any) {
      toast.error('Failed to delete image', { description: err.message })
    }
  }

  const deleteVideoEmbed = async (url: string) => {
    if (!confirm('Are you sure you want to remove this video embed?')) return
    try {
      const currentEmbeds = car?.video_embeds || []
      const updatedEmbeds = currentEmbeds.filter((u: string) => u !== url)

      const { error } = await supabase
        .from('cars')
        .update({ video_embeds: updatedEmbeds })
        .eq('id', carId)

      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ['explore-car-detail', carId] })
      toast.success('Video link removed successfully!')
    } catch (err: any) {
      toast.error('Failed to remove video embed', { description: err.message })
    }
  }

  // Mutation to save or edit a build log
  const saveBuildMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error('Sign in required')
      
      const modsArray = buildForm.mods
        .split(/[,\n]/)
        .map(m => m.trim())
        .filter(Boolean)

      if (buildForm.images.length > 10) {
        throw new Error('You can upload a maximum of 10 images per build log.')
      }

      if (editingBuildId) {
        const { error } = await supabase
          .from('builds')
          .update({
            title: buildForm.title.trim(),
            description: buildForm.description.trim() || null,
            image_url: buildForm.image_url.trim() || null,
            images: buildForm.images,
            youtube_url: buildForm.youtube_url.trim() || null,
            mods: modsArray.length > 0 ? modsArray : null
          })
          .eq('id', editingBuildId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('builds')
          .insert({
            user_id: currentUserId,
            car_id: carId,
            title: buildForm.title.trim(),
            description: buildForm.description.trim() || null,
            image_url: buildForm.image_url.trim() || null,
            images: buildForm.images,
            youtube_url: buildForm.youtube_url.trim() || null,
            mods: modsArray.length > 0 ? modsArray : null
          })
        if (error) throw error
      }
    },
    onSuccess: () => {
      setBuildForm({ title: '', description: '', image_url: '', mods: '', images: [], youtube_url: '' })
      setShowAddBuildForm(false)
      setEditingBuildId(null)
      queryClient.invalidateQueries({ queryKey: ['car-related-builds', carId] })
      queryClient.invalidateQueries({ queryKey: ['explore-car-detail', carId] })
      toast.success(editingBuildId ? 'Build log updated!' : 'Build log posted masterfully! 🛠️')
    },
    onError: (err: any) => {
      errorHandler(err, 'Failed to save build log')
    }
  })

  // Delete a build log
  const deleteBuildMutation = useMutation({
    mutationFn: async (buildId: string) => {
      const { error } = await supabase
        .from('builds')
        .delete()
        .eq('id', buildId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-related-builds', carId] })
      queryClient.invalidateQueries({ queryKey: ['explore-car-detail', carId] })
      toast.success('Build log deleted successfully 🗑️')
    },
    onError: (err: any) => {
      errorHandler(err, 'Failed to delete build log')
    }
  })

  // Delete Entire Car mutation
  const deleteCarMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-cars'] })
      queryClient.invalidateQueries({ queryKey: ['explore-cars-list'] })
      toast.success('Vehicle deleted successfully 🗑️')
      router.push('/garage/me')
    },
    onError: (err: any) => {
      toast.error('Failed to delete vehicle', { description: err.message })
    }
  })

  // Build Image Uploader (Multiple images upload support up to 10!)
  const [uploadingBuildImg, setUploadingBuildImg] = useState(false)
  const handleBuildImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0 || !user) return

    const currentCount = buildForm.images.length
    if (currentCount + files.length > 10) {
      toast.error('Limit exceeded 🚫', { description: 'You can upload a maximum of 10 images per build log.' })
      return
    }

    setUploadingBuildImg(true)
    const toastId = toast.loading('Processing & uploading build photographs...')
    const uploadedUrls: string[] = []

    try {
      const { compressImage } = await import('@/lib/image-utils')

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) continue

        let compressedFile = file
        try {
          compressedFile = await compressImage(file, 1920, 0.83)
        } catch (compressErr) {
          console.error('Client compression failed, using original file', compressErr)
        }

        const randUid = Math.random().toString(36).substring(2, 7)
        const path = `builds/${randUid}-${Date.now()}-${i}.jpg`
        
        const { error: uploadErr } = await supabase.storage.from('user-content').upload(path, compressedFile, {
          upsert: true,
          cacheControl: '31536000'
        })

        if (uploadErr) throw uploadErr

        const { data: { publicUrl } } = supabase.storage.from('user-content').getPublicUrl(path)
        if (publicUrl) {
          uploadedUrls.push(publicUrl)
        }
      }

      if (uploadedUrls.length > 0) {
        setBuildForm(prev => ({
          ...prev,
          image_url: prev.image_url || uploadedUrls[0], // fallback first image as cover image
          images: [...prev.images, ...uploadedUrls]
        }))
        toast.success(`Uploaded ${uploadedUrls.length} build photographs! 📸`, { id: toastId })
      } else {
        toast.error('No images were processed.', { id: toastId })
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Images upload failed', { id: toastId, description: err.message })
    } finally {
      setUploadingBuildImg(false)
    }
  }

  // Error handler helper
  const errorHandler = (err: any, msg: string) => {
    toast.error(msg, { description: err.message ?? 'Unknown error occurred.' })
  }

  // Combine and de-duplicate modifications lists from builds
  const verifiedModsList: string[] = React.useMemo(() => {
    const list: string[] = []
    const seen = new Set<string>()
    relatedBuilds.forEach((b: any) => {
      if (b.mods && Array.isArray(b.mods)) {
        b.mods.forEach((mod: string) => {
          const cleaned = mod.trim()
          if (cleaned && !seen.has(cleaned.toLowerCase())) {
            seen.add(cleaned.toLowerCase())
            list.push(cleaned)
          }
        })
      }
    })
    return list
  }, [relatedBuilds])

  // Grouped and categorized modifications
  const categoriesConfig = React.useMemo(() => [
    { id: 'engine', name: 'Engine Specs & Power', icon: <Flame size={14} className="text-primary" />, keywords: ['engine', 'turbo', 'intake', 'exhaust', 'downpipe', 'manifold', 'supercharger', 'intercooler', 'radiator', 'cooler', 'oil', 'tune', 'ecu', 'injector', 'plug', 'cam', 'piston', 'valve', 'head', 'block', 'belt', 'gasket', 'filter', 'boost', 'wastegate', 'bov', 'blow off', 'throttle', 'fuel', 'pump', 'sleeves'] },
    { id: 'drivetrain', name: 'Drivetrain & Gearbox', icon: <Settings size={14} className="text-primary" />, keywords: ['clutch', 'flywheel', 'differential', 'lsd', 'transmission', 'gearbox', 'shifter', 'axle', 'driveshaft', 'transfer case', 'torque converter', 'prop shaft', 'final drive', 'gear'] },
    { id: 'suspension', name: 'Suspension Setup', icon: <ArrowDownUp size={14} className="text-primary" />, keywords: ['suspension', 'coilover', 'spring', 'shock', 'strut', 'damper', 'sway', 'bushing', 'tension', 'camber', 'arm', 'link', 'knuckle', 'tie rod', 'alignment', 'mount', 'bearing'] },
    { id: 'chassis', name: 'Chassis & Bracing', icon: <Shield size={14} className="text-primary" />, keywords: ['chassis', 'brace', 'cage', 'tower brace', 'underbody', 'skid plate', 'frame', 'reinforcement', 'strut bar', 'fender brace', 'roll bar', 'roll cage'] },
    { id: 'interior', name: 'Interior & Cabin', icon: <Layers size={14} className="text-primary" />, keywords: ['interior', 'seat', 'bucket', 'bride', 'harness', 'steering', 'nardi', 'dash', 'gauge', 'panel', 'pedal', 'mat', 'recaro', 'sparco', 'alcantara', 'cluster', 'momo', 'shift knob'] },
    { id: 'exterior', name: 'Exterior & Aero', icon: <Car size={14} className="text-primary" />, keywords: ['exterior', 'wing', 'spoiler', 'lip', 'diffuser', 'bumper', 'paint', 'wrap', 'hood', 'bonnet', 'trunk', 'splitter', 'widebody', 'bodykit', 'skirt', 'fender', 'grille', 'mirror', 'carbon', 'canard', 'headlight', 'taillight'] },
    { id: 'electronics', name: 'Electronics & Tuning', icon: <Sliders size={14} className="text-primary" />, keywords: ['stand', 'link', 'maxx', 'motec', 'haltech', 'boost controller', 'logger', 'audio', 'speaker', 'wiring', 'sensor', 'display', 'battery', 'ecu', 'harness', 'fuse', 'solenoid'] },
    { id: 'brakes_wheels', name: 'Brakes & Wheels/Tyres', icon: <Disc size={14} className="text-primary" />, keywords: ['brake', 'rotor', 'caliper', 'pad', 'wheel', 'rim', 'tyre', 'tire', 'pilot sport', 'enkei', 'rays', 'volk', 'work', 'bbs', 'brembo', 'advan', 'toyo', 'yokohama', 'lug', 'spacer', 'stud'] },
    { id: 'other', name: 'Other Modifications', icon: <Wrench size={14} className="text-primary" />, keywords: [] }
  ] as const, [])

  const groupedMods = React.useMemo(() => {
    const grouped: { [key: string]: string[] } = {
      engine: [],
      drivetrain: [],
      suspension: [],
      chassis: [],
      interior: [],
      exterior: [],
      electronics: [],
      brakes_wheels: [],
      other: []
    }

    verifiedModsList.forEach(mod => {
      const m = mod.toLowerCase()
      let matched = false
      
      for (const cat of categoriesConfig) {
        if (cat.id !== 'other' && cat.keywords.some(kw => m.includes(kw))) {
          grouped[cat.id].push(mod)
          matched = true
          break
        }
      }
      
      if (!matched) {
        if (m.includes('cusco')) {
          if (m.includes('tension') || m.includes('arm') || m.includes('rod')) {
            grouped.suspension.push(mod)
          } else {
            grouped.chassis.push(mod)
          }
        } else {
          grouped.other.push(mod)
        }
      }
    })

    return grouped
  }, [verifiedModsList, categoriesConfig])

  // Combine multiple imagery vectors into a single photo-reel gallery list
  const carImages = React.useMemo(() => {
    const list: string[] = []
    if (car?.image_url) list.push(car.image_url)
    if (car?.gallery_images && Array.isArray(car.gallery_images)) {
      car.gallery_images.forEach((img: string) => {
        if (img && !list.includes(img)) list.push(img)
      })
    }
    // Pull other related build images to show full media stream
    relatedBuilds.forEach((b: any) => {
      if (b.image_url && !list.includes(b.image_url)) {
        list.push(b.image_url)
      }
    })
    return list
  }, [car?.image_url, car?.gallery_images, relatedBuilds])

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0 || !user || !car) return

    const currentCount = car.gallery_images?.length ?? 0
    if (currentCount + files.length > 100) {
      toast.error('Limit exceeded 🚫', { description: 'You can upload a maximum of 100 custom images per vehicle.' })
      return
    }

    setUploadingGallery(true)
    const toastId = toast.loading('Processing & compressing images...')
    const newUrls: string[] = []

    try {
      const { compressImage } = await import('@/lib/image-utils')

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        if (!file.type.startsWith('image/')) continue
        if (file.size > 20 * 1024 * 1024) {
          toast.warning(`File "${file.name}" was skipped because it exceeds 20MB.`, { id: toastId })
          continue
        }

        // Apply high resolution compression to file up to 1920px bounds - footprint drops to < 300KB!
        let compressedFile = file
        try {
          compressedFile = await compressImage(file, 1920, 0.83)
        } catch (compressErr) {
          console.error('Client compression failed, using original file', compressErr)
        }

        const randUid = Math.random().toString(36).substring(2, 7)
        const path = `cars/${carId}/gallery-${Date.now()}-${randUid}-${i}.jpg`
        
        const { error: uploadErr } = await supabase.storage.from('user-content').upload(path, compressedFile, {
          upsert: true,
          cacheControl: '31536000' // Highly cached browser / edge CDN values (1 Full Year!)
        })

        if (uploadErr) {
          console.error('File upload failure:', uploadErr)
          continue
        }

        const { data: { publicUrl } } = supabase.storage.from('user-content').getPublicUrl(path)
        if (publicUrl) {
          newUrls.push(publicUrl)
        }
      }

      if (newUrls.length > 0) {
        const currentGallery = car.gallery_images || []
        const updatedGallery = [...currentGallery, ...newUrls]

        const { error: updateErr } = await supabase
          .from('cars')
          .update({ gallery_images: updatedGallery })
          .eq('id', carId)

        if (updateErr) throw updateErr

        queryClient.invalidateQueries({ queryKey: ['explore-car-detail', carId] })
        toast.success(`Uploaded ${newUrls.length} images successfully! 📸`, { id: toastId })
      } else {
        toast.error('No images were uploaded.', { id: toastId })
      }
    } catch (err: any) {
      console.error('Upload process err:', err)
      toast.error('Upload failed', { description: err.message ?? 'Unknown error occurred.', id: toastId })
    } finally {
      setUploadingGallery(false)
    }
  }

  if (isCarLoading) {
    return (
      <div className="w-full h-80 flex items-center justify-center animate-pulse">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!car) {
    return (
      <div className="text-center py-20 text-text-muted bg-surface border border-border rounded-xl">
        <ShieldAlert size={48} className="mx-auto mb-4 opacity-30" />
        <p className="text-lg font-bold">Vehicle Not Found</p>
        <p className="text-sm mt-1">This vehicle might have been removed from the directory.</p>
      </div>
    )
  }

  const owner = car.users

  const tabItems = [
    { id: 'overview', label: 'Car Overview', desc: 'Main image, spec & comments', icon: <Car size={14} /> },
    { id: 'mods', label: 'Modifications', desc: 'Full custom part list', icon: <Wrench size={14} /> },
    { id: 'pictures', label: 'Photo & Video Gallery', desc: 'Media with video embeds', icon: <Palette size={14} /> },
    { id: 'builds', label: 'Active Builds Log', desc: 'Modification history journals', icon: <Settings size={14} /> }
  ] as const

  return (
    <div className="w-full space-y-6 p-6">
      
      {/* Back button */}
      <Link
        href="/garage"
        className="inline-flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-white uppercase tracking-wider transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Garage Directory
      </Link>

      {/* Two-Column Side Sub-Menu layout */}
      <div className="grid lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Column: Submenu Tab Switcher */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-surface/50 border border-border p-4 rounded-xl space-y-3">
            <span className="text-[10px] font-black uppercase text-text-muted tracking-widest style-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
              VEHICLE CONTROLS
            </span>
            <div className="flex flex-col gap-1.5">
              {tabItems.map((item) => {
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`group flex items-center justify-between p-3 rounded-xl border transition-all text-left w-full cursor-pointer ${
                      isActive
                        ? 'bg-primary/5 border-primary/40 text-primary font-bold shadow-lg shadow-primary/5'
                        : 'bg-transparent border-transparent text-text-secondary hover:border-border/80 hover:bg-surface-variant/30 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive ? 'bg-primary/20 text-primary' : 'bg-[#1C1F26] text-text-muted group-hover:text-text-secondary'
                      }`}>
                        {item.icon}
                      </div>
                      <div>
                        <h4 className={`text-xs font-semibold leading-none ${isActive ? 'text-white' : 'text-text-secondary group-hover:text-white'}`} style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
                          {item.label}
                        </h4>
                        <span className="text-[9px] text-text-muted block mt-0.5 max-w-31 truncate">{item.desc}</span>
                      </div>
                    </div>
                    <ChevronRight size={13} className={`transition-all ${isActive ? 'opacity-100 translate-x-0.5 text-primary' : 'opacity-0 -translate-x-1 group-hover:opacity-40'}`} />
                  </button>
                )
              })}
            </div>
          </div>

              {/* Quick Specifications Overlay stamp */}
              <div className="bg-surface border border-border rounded-xl p-4 space-y-3.5">
                <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1.5 style-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                  <Settings size={11} className="stroke-[2.5]" /> Specs Summary
                </h4>
                <ul className="space-y-2.5 text-xs text-text-secondary">
                  <li className="flex justify-between border-b border-border/40 pb-1.5">
                    <span>Year:</span> <strong className="text-white">{car.year ?? 'N/A'}</strong>
                  </li>
                  <li className="flex justify-between border-b border-border/40 pb-1.5">
                    <span>Color:</span> <strong className="text-white">{car.color ?? 'N/A'}</strong>
                  </li>
                  <li className="flex justify-between border-b border-border/40 pb-1.5">
                    <span>Engine:</span> <strong className="text-white">{car.engine ?? 'N/A'}</strong>
                  </li>
                  <li className="flex justify-between border-b border-border/40 pb-1.5">
                    <span>Displacement (CC):</span> <strong className="text-white">{car.cc ? `${car.cc} cc` : 'N/A'}</strong>
                  </li>
                  <li className="flex justify-between border-b border-border/40 pb-1.5">
                    <span>Horsepower (HP):</span> <strong className="text-white">{car.hp ? `${car.hp} hp` : 'N/A'}</strong>
                  </li>
                  <li className="flex justify-between border-b border-border/40 pb-1.5">
                    <span>Torque:</span> <strong className="text-white">{car.torque ? `${car.torque} Nm` : 'N/A'}</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>Dyno Builds:</span> <strong className="text-white">{relatedBuilds.length}</strong>
                  </li>
                </ul>
              </div>
        </aside>

        {/* Right Column: Tab Content */}
        <main className="lg:col-span-3 space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Massive Swipeable Cover Photo Gallery and Like Button Overlay */}
              <div className="relative w-full h-80 sm:h-112.5 md:h-125 max-h-125 rounded-2xl overflow-hidden border border-border bg-black shadow-2xl flex items-center justify-center group select-none">
                {carImages.length > 0 ? (
                  <>
                    {/* Blurred depth underlay */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center filter blur-md opacity-25 scale-105 pointer-events-none transition-all duration-300"
                      style={{ backgroundImage: `url(${carImages[activeImageIndex]})` }}
                    />
                    
                    {/* Main Image content bounds (Clamped at 500px) */}
                    <div 
                      onClick={() => setZoomImage(carImages[activeImageIndex])}
                      className="relative w-full h-full flex items-center justify-center cursor-zoom-in z-2"
                    >
                      <Image
                        src={carImages[activeImageIndex]}
                        alt={`${car.make} ${car.model}`}
                        fill
                        className="object-contain w-full h-full transition-opacity duration-300"
                        sizes="(max-width: 1200px) 100vw, 1000px"
                        priority
                      />
                    </div>

                    {/* Left Carousel Arrow */}
                    {carImages.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveImageIndex((prev) => (prev === 0 ? carImages.length - 1 : prev - 1))
                        }}
                        className="absolute left-4 p-2.5 rounded-full bg-black/60 hover:bg-black/95 text-white backdrop-blur border border-white/10 opacity-0 group-hover:opacity-100 transition-all z-10 cursor-pointer active:scale-90"
                      >
                        <ChevronLeft size={16} className="stroke-[2.5]" />
                      </button>
                    )}

                    {/* Right Carousel Arrow */}
                    {carImages.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveImageIndex((prev) => (prev === carImages.length - 1 ? 0 : prev + 1))
                        }}
                        className="absolute right-4 p-2.5 rounded-full bg-black/60 hover:bg-black/95 text-white backdrop-blur border border-white/10 opacity-0 group-hover:opacity-100 transition-all z-10 cursor-pointer active:scale-90"
                      >
                        <ChevronRight size={16} className="stroke-[2.5]" />
                      </button>
                    )}

                    {/* Slide Counter Overlay Badge */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur px-3.5 py-1.5 rounded-full border border-white/10 text-[10px] font-mono font-bold text-white tracking-widest z-10 flex items-center gap-1.5 leading-none">
                      <span>MEDIA</span>
                      <span className="text-primary font-black">{activeImageIndex + 1}</span>
                      <span className="text-white/35">/</span>
                      <span>{carImages.length}</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 bg-linear-to-br from-[#1C1F26] to-background flex items-center justify-center">
                    <Car size={64} className="text-primary/20 animate-pulse" />
                  </div>
                )}

                {/* Like Button Overlay */}
                <button
                  onClick={() => toggleLikeMutation.mutate()}
                  className={`absolute top-4 right-4 p-3 rounded-full hover:scale-110 active:scale-95 transition-all text-xs border cursor-pointer z-10 ${
                    isLiked
                      ? 'bg-primary border-primary text-black font-extrabold shadow-lg shadow-primary/30'
                      : 'bg-black/60 border-border text-white hover:border-white'
                  }`}
                >
                  <Heart size={16} fill={isLiked ? 'black' : 'none'} className="shrink-0" />
                </button>
              </div>

              {/* Owner Direct Multi-image Secure Upload Suite */}
              {user && currentUserId === car.user_id && (
                <div className="bg-surface border border-dashed border-border/85 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider style-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                      🌌 Build Media Gallery ({car.gallery_images?.length ?? 0}/100 images)
                    </h3>
                    <p className="text-[10px] text-text-muted leading-relaxed">
                      Upload high-resolution specifications or build logs here. We compress each block and cache them heavily on edge CDNs!
                    </p>
                  </div>
                  <div>
                    <label className="btn-primary py-2 px-4.5 text-xs font-black flex items-center gap-1.5 cursor-pointer hover:scale-102 active:scale-98 transition-all shrink-0">
                      {uploadingGallery ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Compressing & Uploading...
                        </>
                      ) : (
                        <>
                          <UploadCloud size={14} />
                          Add Images
                        </>
                      )}
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingGallery}
                        onChange={handleGalleryUpload}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Title & Technical Metadata Header */}
              {isEditingSpecs && user && currentUserId === car.user_id ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveSpecsMutation.mutate();
                  }}
                  className="bg-surface border border-primary/20 p-6 rounded-2xl space-y-5 animate-fade-in text-left"
                >
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider style-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                      ✏️ Edit Vehicle Profile & Specs
                    </h3>
                    <button type="button" onClick={() => setIsEditingSpecs(false)} className="text-text-muted hover:text-white text-xs">
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1.5 uppercase font-bold">Make *</label>
                      <input 
                        value={specsForm.make} 
                        onChange={(e) => setSpecsForm({ ...specsForm, make: e.target.value })} 
                        className="input text-xs w-full bg-background" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1.5 uppercase font-bold">Model *</label>
                      <input 
                        value={specsForm.model} 
                        onChange={(e) => setSpecsForm({ ...specsForm, model: e.target.value })} 
                        className="input text-xs w-full bg-background" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1.5 uppercase font-bold">Year</label>
                      <input 
                        type="number" 
                        value={specsForm.year} 
                        onChange={(e) => setSpecsForm({ ...specsForm, year: e.target.value })} 
                        className="input text-xs w-full bg-background" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1.5 uppercase font-bold">Color</label>
                      <input 
                        value={specsForm.color} 
                        onChange={(e) => setSpecsForm({ ...specsForm, color: e.target.value })} 
                        className="input text-xs w-full bg-background" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1.5 uppercase font-bold">Engine Code</label>
                      <input 
                        value={specsForm.engine} 
                        onChange={(e) => setSpecsForm({ ...specsForm, engine: e.target.value })} 
                        className="input text-xs w-full bg-background" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1.5 uppercase font-bold">Displacement (CC)</label>
                      <input 
                        type="number" 
                        value={specsForm.cc} 
                        onChange={(e) => setSpecsForm({ ...specsForm, cc: e.target.value })} 
                        className="input text-xs w-full bg-background" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1.5 uppercase font-bold">Horsepower (HP)</label>
                      <input 
                        type="number" 
                        value={specsForm.hp} 
                        onChange={(e) => setSpecsForm({ ...specsForm, hp: e.target.value })} 
                        className="input text-xs w-full bg-background" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1.5 uppercase font-bold">Torque (Nm)</label>
                      <input 
                        type="number" 
                        value={specsForm.torque} 
                        onChange={(e) => setSpecsForm({ ...specsForm, torque: e.target.value })} 
                        className="input text-xs w-full bg-background" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1.5 uppercase font-bold">Work Log Story / Biography</label>
                    <textarea 
                      value={specsForm.car_bio} 
                      onChange={(e) => setSpecsForm({ ...specsForm, car_bio: e.target.value })} 
                      className="input text-xs w-full bg-background min-h-20" 
                      placeholder="My pride and joy Supra build..."
                    />
                  </div>
                  
                  {/* cover image edit row */}
                  <div className="border-t border-border/40 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white uppercase style-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                        🖼️ Dynamic Cover Photo Setup
                      </h4>
                      <p className="text-[10px] text-text-muted leading-relaxed">
                        Upload a primary image. This is cached heavily on edge CDNs!
                      </p>
                    </div>
                    <div>
                      <label className="btn-primary py-2 px-4 text-xs font-black flex items-center gap-1.5 cursor-pointer hover:scale-102 active:scale-98 transition-all shrink-0">
                        {uploadingCover ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Uploading Cover Image...
                          </>
                        ) : (
                          <>
                            <UploadCloud size={14} />
                            Upload Cover Photo
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingCover}
                          onChange={handleCoverUpload}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end border-t border-border/40 pt-4">
                    <button type="submit" disabled={saveSpecsMutation.isPending} className="btn-primary py-1.5 px-4 text-xs">
                      {saveSpecsMutation.isPending ? 'Saving...' : 'Save Settings'}
                    </button>
                    <button type="button" onClick={() => setIsEditingSpecs(false)} className="btn-ghost py-1.5 px-4 text-xs">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-surface border border-border p-6 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl sm:text-3.5xl font-black leading-tight text-white style-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                          {car.make} {car.model}
                        </h1>
                        <div className="flex items-center gap-1.5 text-text-muted bg-primary/5 border border-primary/25 rounded-md px-2.5 py-0.5 text-xs font-bold font-mono">
                          <Heart size={12} className="text-primary fill-primary" /> {car.likes_count ?? 0} Likes
                        </div>
                        {user && currentUserId === car.user_id && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setIsEditingSpecs(true)}
                              className="flex items-center gap-1.5 text-[11px] font-bold text-primary border border-primary/30 hover:bg-primary/5 rounded-md px-3 py-1.5 transition-all uppercase cursor-pointer"
                            >
                              <Edit3 size={12} /> Edit Specs & Cover
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Are you absolutely sure you want to delete this entire vehicle profile? All specs and build logs will be permanently deleted!')) {
                                  deleteCarMutation.mutate();
                                }
                              }}
                              disabled={deleteCarMutation.isPending}
                              className="flex items-center gap-1.5 text-[11px] font-bold text-error border border-error/30 hover:bg-error/5 rounded-md px-3 py-1.5 transition-all uppercase cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 size={12} /> {deleteCarMutation.isPending ? 'Deleting...' : 'Delete Profile'}
                            </button>
                          </div>
                        )}
                      </div>
                      {car.car_bio && (
                        <p className="text-text-secondary text-sm max-w-3xl leading-relaxed whitespace-pre-wrap">{car.car_bio}</p>
                      )}
                    </div>
                    
                    {/* Owner specs block */}
                    {owner && (
                      <Link href={`/u/${owner.username}`} className="flex items-center gap-2.5 bg-black/40 border border-border p-3 rounded-xl shrink-0 hover:border-primary/50 transition-colors">
                        {owner.avatar_url ? (
                          <Image src={owner.avatar_url} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover border border-border shrink-0" />
                        ) : (
                          <DefaultAvatar className="w-8 h-8 shrink-0" />
                        )}
                        <div>
                          <span className="text-[10px] text-text-muted font-bold block uppercase leading-none">OWNER PROFILE</span>
                          <span className="text-xs text-white font-extrabold block mt-1">{owner.display_name || owner.username}</span>
                        </div>
                      </Link>
                    )}
                  </div>

                  {/* Micro metrics grids */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 border-t border-border/40 pt-4">
                    <div className="bg-black/30 p-3 rounded-xl text-left border border-border/40">
                      <span className="text-[9px] text-text-muted font-bold uppercase block leading-none mb-1.5">MANUFACTURE YEAR</span>
                      <strong className="text-sm text-white font-black">{car.year ?? 'N/A'}</strong>
                    </div>
                    <div className="bg-black/30 p-3 rounded-xl text-left border border-border/40">
                      <span className="text-[9px] text-text-muted font-bold uppercase block leading-none mb-1.5">INTERNAL ENGINE</span>
                      <strong className="text-sm text-white font-black">{car.engine ?? 'N/A'}</strong>
                    </div>
                    <div className="bg-black/30 p-3 rounded-xl text-left border border-border/40">
                      <span className="text-[9px] text-text-muted font-bold uppercase block leading-none mb-1.5">BODY COAT PAINT</span>
                      <strong className="text-sm text-white font-black">{car.color ?? 'N/A'}</strong>
                    </div>
                    <div className="bg-black/30 p-3 rounded-xl text-left border border-border/40">
                      <span className="text-[9px] text-text-muted font-bold uppercase block leading-none mb-1.5">DISPLACEMENT</span>
                      <strong className="text-sm text-white font-black">{car.cc ? `${car.cc} cc` : 'N/A'}</strong>
                    </div>
                    <div className="bg-black/30 p-3 rounded-xl text-left border border-border/40">
                      <span className="text-[9px] text-text-muted font-bold uppercase block leading-none mb-1.5">HORSEPOWER</span>
                      <strong className="text-sm text-white font-black">{car.hp ? `${car.hp} hp` : 'N/A'}</strong>
                    </div>
                    <div className="bg-black/30 p-3 rounded-xl text-left border border-border/40">
                      <span className="text-[9px] text-text-muted font-bold uppercase block leading-none mb-1.5">TORQUE</span>
                      <strong className="text-sm text-white font-black">{car.torque ? `${car.torque} Nm` : 'N/A'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Q&A / Comments sections below */}
              <div className="bg-surface border border-border rounded-2xl p-6 space-y-6">
                <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
                  <MessageSquare size={16} className="text-primary" /> Discussions & Inquiries ({comments.length})
                </h3>

                {/* Input box */}
                {user ? (
                  <form onSubmit={handlePostComment} className="bg-black/40 border border-border/60 p-4 rounded-xl space-y-3">
                    <div className="flex items-start gap-3">
                      <DefaultAvatar className="w-8 h-8 shrink-0 mt-0.5" />
                      <textarea
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        placeholder="Ask the owner about modifications, dyno numbers or fitment details..."
                        required
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-20 placeholder:text-text-muted"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={addCommentMutation.isPending || !commentContent.trim()}
                        className="btn-primary py-1.5 px-4 text-xs font-bold flex items-center gap-1.5"
                      >
                        <Send size={11} /> Comment
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-surface-variant/40 border border-border/60 p-4 rounded-xl text-center text-xs text-text-muted">
                    Pls <Link href="/login" className="text-primary hover:underline font-bold">Sign In</Link> to post questions to this vehicle dashboard.
                  </div>
                )}

                {/* Remarks lists */}
                {comments.length === 0 ? (
                  <p className="text-center text-xs text-text-disabled py-4">No questions posted yet. Ask about the specs!</p>
                ) : (
                  <div className="space-y-4 divide-y divide-border/30">
                    {comments.map((comm: any) => (
                      <div key={comm.id} className="pt-4 first:pt-0 flex gap-3">
                        {comm.users?.avatar_url ? (
                          <Image src={comm.users.avatar_url} alt="" width={28} height={28} className="w-7 h-7 rounded-full object-cover border border-border shrink-0" />
                        ) : (
                          <DefaultAvatar className="w-7 h-7 shrink-0" />
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-text-primary text-xs font-bold leading-none">{comm.users?.display_name || comm.users?.username || 'Member'}</span>
                            <span className="text-text-disabled text-[9px]">{timeAgo(comm.created_at)}</span>
                          </div>
                          <p className="text-sm text-text-secondary pr-2 whitespace-pre-wrap leading-relaxed">{comm.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: MODIFICATIONS */}
          {activeTab === 'mods' && (
            <div className="bg-surface border border-border p-6 rounded-2xl space-y-6 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
                    Registered Modifications & Hardware Specs
                  </h2>
                </div>
                {user && currentUserId === car.user_id && (
                  <button
                    onClick={() => {
                      setActiveTab('builds');
                      setShowAddBuildForm(true);
                    }}
                    className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 shrink-0"
                  >
                    <Plus size={12} /> Add Mod via Build
                  </button>
                )}
              </div>

              {user && currentUserId === car.user_id && (
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl text-xs text-text-secondary leading-relaxed">
                  💡 <strong>How to manage modifications:</strong> Hardware parts are automatically compiled and grouped dynamically from your <strong>Active Build Logs</strong>. To add or edit modifications, simply create a new Build Journal or edit an existing one in the <button onClick={() => setActiveTab('builds')} className="text-primary hover:underline font-bold inline bg-transparent p-0 border-none">Builds Log</button> tab!
                </div>
              )}
              
              {verifiedModsList.length === 0 ? (
                <div className="text-center py-12 text-text-muted">
                  <Wrench size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No specific hardware mods have been detailed on any project build logs yet.</p>
                </div>
              ) : (
                <div className="space-y-6 pt-2">
                  {categoriesConfig.map((cat) => {
                    const list = groupedMods[cat.id] || []
                    if (list.length === 0) return null

                    return (
                      <div key={cat.id} className="bg-black/25 border border-border/50 rounded-xl overflow-hidden shadow-sm">
                        {/* Section Header */}
                        <div className="bg-surface/50 border-b border-border/30 px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {cat.icon}
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest style-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                              {cat.name}
                            </h3>
                          </div>
                          <span className="text-[10px] font-mono bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                            {list.length} item{list.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        {/* Single Column Vertical Stack List */}
                        <div className="divide-y divide-border/20">
                          {list.map((mod, idx) => (
                            <div key={idx} className="p-3.5 flex items-start gap-3 hover:bg-[#151922]/10 transition-colors">
                              <span className="w-5 h-5 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-[9px] font-black shrink-0 mt-0.5">
                                ✓
                              </span>
                              <span className="text-xs text-text-secondary font-medium leading-relaxed">{mod}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PICTURES & VIDEO GALLERY */}
          {activeTab === 'pictures' && (
            <div className="bg-surface border border-border p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-3 gap-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
                    Photo & Video Gallery Documentation
                  </h2>
                </div>
              </div>

              {/* Video Embed Addition Form (Display only if current user is owner!) */}
              {user && currentUserId === car.user_id && (
                <form onSubmit={handleAddVideo} className="bg-black/30 border border-border p-4 rounded-xl space-y-3.5 shadow-lg">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5" style={{ fontFamily: 'var(--font-orbitron)' }}>
                      🌌 Add Video Link or Social Embed
                    </h3>
                    <p className="text-[10px] text-text-muted leading-relaxed">
                      Insert a standard share link from YouTube, Instagram (posts/stories), or TikTok to build your dynamic video board!
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={embedUrl}
                      onChange={(e) => setEmbedUrl(e.target.value)}
                      placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                      required
                      className="input text-xs py-2 bg-background border border-border rounded-lg text-white placeholder:text-text-muted flex-1 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={addVideoMutation.isPending || !embedUrl.trim()}
                      className="btn-primary py-2 px-4 text-xs font-black shrink-0"
                    >
                      Embed Video
                    </button>
                  </div>
                </form>
              )}

              {/* Dynamic Video Embed Board Grid */}
              {car.video_embeds && car.video_embeds.length > 0 && (
                <div className="space-y-3.5">
                  <h4 className="text-[11px] font-black uppercase text-primary tracking-widest leading-none flex items-center gap-1.5 style-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                    📹 Embedded Video Logs ({car.video_embeds.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {car.video_embeds.map((url: string, index: number) => {
                      // Parse if its YouTube standard/share links to extract embed ID
                      let embedSrc = url
                      let isYoutube = false
                      let isTikTok = false
                      let isInstagram = false

                      try {
                        const parsed = new URL(url)
                        if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
                          isYoutube = true
                          let videoId = ''
                          if (parsed.hostname.includes('youtu.be')) {
                            videoId = parsed.pathname.substring(1)
                          } else {
                            videoId = parsed.searchParams.get('v') || ''
                          }
                          embedSrc = `https://www.youtube.com/embed/${videoId}`
                        } else if (parsed.hostname.includes('tiktok.com')) {
                          isTikTok = true
                        } else if (parsed.hostname.includes('instagram.com')) {
                          isInstagram = true
                          // Standard instagram /p/ embed URL suffix
                          let cleanedPath = parsed.pathname
                          if (!cleanedPath.endsWith('/')) cleanedPath += '/'
                          embedSrc = `https://www.instagram.com${cleanedPath}embed`
                        }
                      } catch (_) {}

                      return (
                        <div key={index} className="bg-black/40 border border-border p-3 rounded-xl flex flex-col justify-between space-y-3 shadow-md">
                          
                          {/* Main iframe embed blocks */}
                          <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-surface shrink-0">
                            {isYoutube ? (
                              <iframe
                                src={embedSrc}
                                title={`Youtube Video ${index}`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="absolute inset-0 w-full h-full border-x-0 border-y-0"
                              />
                            ) : isInstagram ? (
                              <iframe
                                src={embedSrc}
                                title={`Instagram Embed ${index}`}
                                allowFullScreen
                                className="absolute inset-0 w-full h-full border-0"
                              />
                            ) : (
                              /* Standard Fallback hyperlink container for TikTok / generic links */
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-surface text-center space-y-2">
                                <span className="text-xl">📹</span>
                                <h5 className="text-[11px] text-white font-bold max-w-xs truncate">Social Video link</h5>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-primary hover:underline font-extrabold flex items-center gap-1"
                                >
                                  Open Stream Source 🏎️
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-text-muted font-mono leading-none">
                            <span>Video link #{index + 1}</span>
                            <div className="flex items-center gap-2.5">
                              <span className="text-primary uppercase font-bold text-[9px]">
                                {isYoutube ? 'YouTube' : isInstagram ? 'Instagram' : 'TikTok / Feed'}
                              </span>
                              {user && currentUserId === car.user_id && (
                                <button
                                  type="button"
                                  onClick={() => deleteVideoEmbed(url)}
                                  className="text-text-muted hover:text-error transition-colors cursor-pointer"
                                  title="Delete Embed"
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </div>
                          </div>

                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Photo grid */}
              <div className="space-y-4 pt-4 border-t border-border/40 text-left">
                <h4 className="text-[11px] font-black uppercase text-text-muted tracking-widest leading-none flex items-center gap-1.5 style-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                  📸 Photo Documentation Logs
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* 1. Main Cover Image */}
                  {car.image_url ? (
                    <div 
                      onClick={() => setZoomImage(car.image_url)}
                      className="relative aspect-video rounded-xl overflow-hidden border border-primary/35 bg-black group cursor-pointer"
                    >
                      <Image src={car.image_url} alt="" fill className="object-cover group-hover:scale-102 transition-transform duration-300" sizes="(max-width: 400px) 100vw, 300px" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity gap-1.5 p-2">
                        <span className="text-[9px] text-[#06B6D4] font-black uppercase tracking-wider bg-black/75 border border-primary/30 px-2 py-1 rounded-md">
                          Cover Photo ★
                        </span>
                        <span className="text-[9px] text-white/70">Click to Zoom</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-dashed border-border flex items-center justify-center text-text-muted text-xs">
                      No cover image set
                    </div>
                  )}

                  {/* 2. Gallery Images with Owner Hover Controls */}
                  {car.gallery_images && Array.isArray(car.gallery_images) && car.gallery_images.map((img: string, idx: number) => (
                    <div 
                      key={`gallery-${idx}`}
                      onClick={() => setZoomImage(img)}
                      className="relative aspect-video rounded-xl overflow-hidden border border-border bg-black group cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <Image src={img} alt="" fill className="object-cover group-hover:scale-102 transition-transform duration-300" sizes="(max-width: 400px) 100vw, 300px" />
                      
                      {/* Standard click overlay for non-owners */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none group-hover:pointer-events-auto">
                        <span className="text-[10px] text-white font-extrabold uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded-xl">Zoom Image</span>
                      </div>

                      {/* Explicit absolute hovering/click buttons overlay for owners */}
                      {user && currentUserId === car.user_id && (
                        <div 
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity p-2 gap-2"
                          onClick={(e) => e.stopPropagation()} // stop zoom click
                        >
                          <button
                            type="button"
                            onClick={() => selectCoverFromGallery(img)}
                            className="bg-primary/20 border border-primary/40 hover:bg-primary hover:text-black py-1 px-2.5 rounded-md text-[9px] font-black uppercase text-primary transition-all cursor-pointer"
                          >
                            Set Cover
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteGalleryImage(img)}
                            className="bg-error/20 border border-error/40 hover:bg-error hover:text-white p-1.5 rounded-md text-error transition-all cursor-pointer"
                            title="Delete Image"
                          >
                            <Trash2 size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setZoomImage(img)}
                            className="bg-white/10 border border-white/20 hover:bg-white/20 p-1.5 rounded-md text-white transition-all cursor-pointer"
                            title="Zoom"
                          >
                            <Maximize2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* 3. Extra images from Build Journals */}
                  {relatedBuilds.map((b: any, idx: number) => {
                    if (!b.image_url || (car.gallery_images && car.gallery_images.includes(b.image_url)) || b.image_url === car.image_url) return null;
                    return (
                      <div 
                        key={`build-img-${idx}`}
                        className="relative aspect-video rounded-xl overflow-hidden border border-border bg-black group cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => setZoomImage(b.image_url)}
                      >
                        <Image src={b.image_url} alt="" fill className="object-cover group-hover:scale-102 transition-transform duration-300" sizes="(max-width: 400px) 100vw, 300px" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity gap-1 p-2">
                          <span className="text-[10px] text-white font-extrabold uppercase tracking-widest bg-black/75 px-3 py-1.5 rounded-xl border border-white/10 text-center leading-none">
                            Build Photo
                          </span>
                          <span className="text-[8px] text-text-muted">From Build Journal</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {(!car.image_url && (!car.gallery_images || car.gallery_images.length === 0) && relatedBuilds.length === 0) && (
                  <div className="text-center py-6 text-text-muted">No images uploaded to this workspace yet.</div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: BUILDS LOG */}
          {activeTab === 'builds' && (
            <div className="space-y-6 text-left">
              <div className="bg-surface border border-border p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
                    Project Build Logs & Dyno Sheets ({relatedBuilds.length})
                  </h2>
                </div>
                {user && currentUserId === car.user_id && !showAddBuildForm && !editingBuildId && (
                  <button
                    type="button"
                    onClick={() => {
                      setBuildForm({ title: '', description: '', image_url: '', mods: '', images: [], youtube_url: '' });
                      setShowAddBuildForm(true);
                      setEditingBuildId(null);
                    }}
                    className="btn-primary py-1.5 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} /> Add Build Journal
                  </button>
                )}
              </div>

              {/* Add / Edit Build Journal Form */}
              {user && currentUserId === car.user_id && (showAddBuildForm || editingBuildId) && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveBuildMutation.mutate();
                  }}
                  className="bg-surface border border-primary/20 p-6 rounded-2xl space-y-4 animate-fade-in"
                >
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider style-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
                    {editingBuildId ? '✏️ Edit Build Journal entry' : '🛠️ Publish New Build Journal entry'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] text-text-muted mb-1.5 uppercase font-bold">Journal Title *</label>
                        <input
                          type="text"
                          value={buildForm.title}
                          onChange={(e) => setBuildForm({ ...buildForm, title: e.target.value })}
                          placeholder="e.g., Dyno Tune & Stage 2 Fueling Setup"
                          required
                          className="input text-xs w-full bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-text-muted mb-1.5 uppercase font-bold">Journal Description</label>
                        <textarea
                          value={buildForm.description}
                          onChange={(e) => setBuildForm({ ...buildForm, description: e.target.value })}
                          placeholder="Provide numbers, dyno graphs results, custom hardware notes or fitment details..."
                          className="input text-xs w-full bg-background h-24"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-text-muted mb-1.5 uppercase font-bold">YouTube Video Link</label>
                        <input
                          type="url"
                          value={buildForm.youtube_url}
                          onChange={(e) => setBuildForm({ ...buildForm, youtube_url: e.target.value })}
                          placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                          className="input text-xs w-full bg-background"
                        />
                        <span className="text-[9px] text-text-muted block mt-1">Accepts one YouTube link. Will be dynamically embedded.</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] text-text-muted mb-1.5 uppercase font-bold">Modifications separated by commas or newlines</label>
                        <textarea
                          value={buildForm.mods}
                          onChange={(e) => setBuildForm({ ...buildForm, mods: e.target.value })}
                          placeholder="e.g., Mishimoto Intercooler, Cusco Front Strut Brace, Deem Heat Sleeves"
                          className="input text-xs w-full bg-background h-24"
                        />
                        <span className="text-[9px] text-text-muted block mt-1">Split items with a comma or press Enter.</span>
                      </div>

                      {/* Multiple Image Upload Row */}
                      <div>
                        <label className="block text-[10px] text-text-muted mb-1.5 uppercase font-bold">Upload Build Images (Up to 10)</label>
                        <div className="flex flex-col gap-2.5">
                          {buildForm.images.length > 0 && (
                            <div className="grid grid-cols-5 gap-2 border border-border p-2 rounded-lg bg-black/40">
                              {buildForm.images.map((imgUrl, i) => (
                                <div key={i} className="relative aspect-square rounded overflow-hidden group">
                                  <Image src={imgUrl} alt="" fill className="object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => setBuildForm(prev => {
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
                              value={buildForm.image_url}
                              onChange={(e) => setBuildForm({ ...buildForm, image_url: e.target.value })}
                              placeholder="Cover Image URL or upload below..."
                              className="input text-xs flex-1 bg-background"
                            />
                            <label className="btn-primary py-2 px-3.5 text-xs flex items-center justify-center cursor-pointer shrink-0">
                              {uploadingBuildImg ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <UploadCloud size={13} />
                              )}
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingBuildImg}
                                onChange={handleBuildImageUpload}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end border-t border-border/40 pt-4">
                    <button type="submit" disabled={saveBuildMutation.isPending} className="btn-primary py-1.5 px-4 text-xs font-bold">
                      {saveBuildMutation.isPending ? 'Publishing...' : 'Publish Journal'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddBuildForm(false);
                        setEditingBuildId(null);
                        setBuildForm({ title: '', description: '', image_url: '', mods: '', images: [], youtube_url: '' });
                      }}
                      className="btn-ghost py-1.5 px-4 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {relatedBuilds.length === 0 ? (
                <div className="bg-surface border border-border text-center py-16 text-text-muted rounded-2xl">
                  <Settings size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">There are currently no active system modifications journals linked to this vehicle.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relatedBuilds.map((build: any) => (
                    <div 
                      key={build.id} 
                      className="group relative flex flex-col justify-between h-56 rounded-2xl bg-linear-to-b from-[#181d29] to-[#0d1017] border border-white/5 hover:border-white/15 transition-all duration-300 overflow-hidden"
                    >
                      {/* Image / Graphic section */}
                      <Link href={`/garage/builds/${build.id}`} className="aspect-video relative bg-[#0e1017] overflow-hidden shrink-0 h-32 w-full border-b border-border/40 block">
                        {build.image_url ? (
                          <Image src={build.image_url} alt="" fill className="object-cover group-hover:scale-102 transition-transform duration-300" sizes="(max-width: 400px) 100vw, 300px" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Wrench size={24} className="text-primary/20" />
                          </div>
                        )}
                      </Link>

                      {/* Explicit owner CRUD actions overlay on the top right */}
                      {user && currentUserId === car.user_id && (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBuildId(build.id);
                              setShowAddBuildForm(false);
                              setBuildForm({
                                title: build.title || '',
                                description: build.description || '',
                                image_url: build.image_url || '',
                                mods: build.mods ? build.mods.join(', ') : '',
                                images: build.images || (build.image_url ? [build.image_url] : []),
                                youtube_url: build.youtube_url || ''
                              });
                              window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                            className="p-1 px-2 text-[10px] font-black uppercase text-primary border border-primary/20 bg-black/75 rounded-md hover:bg-primary hover:text-black transition-colors cursor-pointer"
                            title="Edit Build Journal"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Delete this build log entry permanently?')) {
                                deleteBuildMutation.mutate(build.id);
                              }
                            }}
                            className="p-1 px-1.5 text-xs text-error border border-error/20 bg-black/75 rounded-md hover:bg-error hover:text-white transition-colors cursor-pointer"
                            title="Delete Build Journal"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <Link href={`/garage/builds/${build.id}`} className="block">
                          <h3 className="text-xs font-bold text-white group-hover:text-primary transition-colors line-clamp-1 truncate uppercase tracking-wide" style={{ fontFamily: 'var(--font-orbitron)' }}>
                            {build.title}
                          </h3>
                        </Link>
                        <p className="text-[10px] text-text-secondary mt-1.5 leading-relaxed line-clamp-2">{build.description}</p>
                        <span className="text-[9px] text-text-muted mt-3 block">{timeAgo(build.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>

      </div>

      {/* Lightbox Modal Zoom portal */}
      {zoomImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-1000 flex flex-col items-center justify-center p-4 select-none cursor-pointer"
          onClick={() => setZoomImage(null)}
        >
          {/* Transparent Glassmorphism Close Button */}
          <button 
            type="button"
            onClick={() => setZoomImage(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-surface hover:bg-surface-variant transition-colors border border-border text-white shadow-xl cursor-pointer z-10 flex items-center justify-center active:scale-90"
          >
            <X size={20} className="stroke-[2.5]" />
          </button>
          
          <div 
            className="relative w-full h-[85vh] flex items-center justify-center pointer-events-none" 
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={zoomImage}
              alt="Zoomed Vehicle details"
              fill
              className="object-contain max-w-full max-h-full"
              sizes="100vw"
              priority
            />
          </div>
          
          <span className="text-[10px] text-text-muted mt-5 font-mono select-none tracking-widest uppercase">
            Click anywhere or tap top-right cross to return to workshop
          </span>
        </div>
      )}

    </div>
  )
}