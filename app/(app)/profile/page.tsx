'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Camera, MapPin, FileText, Save, Edit2 } from 'lucide-react'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/lib/supabase/types'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ display_name: '', bio: '', location: '' })
  const [uploading, setUploading] = useState(false)

  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      return data as Profile | null
    },
    enabled: !!user,
  })

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
      })
    }
  }, [profile])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) return
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: form.display_name.trim() || null,
          bio: form.bio.trim() || null,
          location: form.location.trim() || null,
        })
        .eq('id', user.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Profile updated')
      setEditing(false)
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
    },
    onError: () => toast.error('Failed to update profile'),
  })

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2 MB'); return }
    setUploading(true)
    const path = `avatars/${user.id}/${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) { toast.error('Upload failed'); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })
    queryClient.invalidateQueries({ queryKey: ['my-profile'] })
    toast.success('Avatar updated!')
    setUploading(false)
  }

  if (!user && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted px-4">
        <User size={48} className="mb-4 opacity-30" />
        <p className="text-lg mb-2">Sign in to view your profile</p>
        <a href="/login" className="btn-primary mt-4">Sign In</a>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="card p-6 animate-pulse space-y-4">
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-full bg-surface-variant" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surface-variant rounded w-1/2" />
              <div className="h-3 bg-surface-variant rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">My Profile</h1>
        {!editing && (
          <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <Edit2 size={14} /> Edit
          </button>
        )}
      </div>

      <div className="card p-6 mb-4">
        {/* Avatar */}
        <div className="flex items-start gap-5 mb-5">
          <div className="relative group">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name || 'Avatar'}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-primary text-2xl font-bold">
                {getInitials(profile?.display_name || profile?.username || 'U')}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera size={20} className="text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-text-primary">{profile?.display_name || profile?.username}</h2>
              {profile?.is_verified && <span className="badge-primary text-xs">Verified</span>}
            </div>
            <div className="text-text-muted text-sm">@{profile?.username}</div>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-text-secondary"><span className="text-text-primary font-semibold">{profile?.following_count ?? 0}</span> following</span>
              <span className="text-text-secondary"><span className="text-text-primary font-semibold">{profile?.followers_count ?? 0}</span> followers</span>
            </div>
          </div>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Display Name</label>
              <input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                className="input"
                placeholder="Your display name"
                maxLength={50}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="input resize-none min-h-[100px]"
                placeholder="Tell the community about yourself..."
                maxLength={300}
              />
              <div className="text-right text-text-muted text-xs mt-1">{form.bio.length}/300</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="input"
                placeholder="Kuala Lumpur, Malaysia"
                maxLength={100}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={14} />
                {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {profile?.bio && (
              <div className="flex gap-2">
                <FileText size={14} className="text-primary shrink-0 mt-0.5" />
                <p className="text-text-secondary text-sm leading-relaxed">{profile.bio}</p>
              </div>
            )}
            {profile?.location && (
              <div className="flex items-center gap-2 text-text-muted text-sm">
                <MapPin size={14} className="text-primary" />
                <span>{profile.location}</span>
              </div>
            )}
            {!profile?.bio && !profile?.location && (
              <p className="text-text-muted text-sm">No profile info yet. Add some!</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
