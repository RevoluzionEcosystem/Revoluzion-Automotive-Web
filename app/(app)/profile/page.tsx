'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Camera, MapPin, FileText, Edit2, Share2, Smartphone, Car, Wrench, Store,
  CalendarDays, ShoppingCart, Bell, Settings, LogOut, HelpCircle, Bug,
  ScrollText, Shield, ChevronRight, Lock, MessageSquare, Mail, Globe,
  Save, X, User, Heart, Package, Truck,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import type { Profile } from '@/lib/supabase/types'
import { useRouter } from 'next/navigation'

import { compressImage } from '@/lib/image-utils'

export default function ProfilePage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ display_name: '', bio: '', location: '', company_name: '' })
  const [helpOpen, setHelpOpen] = useState(false)
  const [bugOpen, setBugOpen] = useState(false)
  const [signOutOpen, setSignOutOpen] = useState(false)

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
      const { data } = await supabase.from('users').select('id, username, display_name, avatar_url, bio, location, company_name, is_verified, role, shop_role, followers_count, following_count, garage_count, created_at, instagram, tiktok, youtube, facebook, twitter_x, website').eq('id', user.id).single()
      return data as Profile | null
    },
    enabled: !!user,
  })

  const { data: stats } = useQuery({
    queryKey: ['profile-stats', user?.id],
    queryFn: async () => {
      if (!user) return { builds: 0, posts: 0 }
      const [buildsRes, postsRes] = await Promise.all([
        supabase.from('builds').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ])
      return { builds: buildsRes.count ?? 0, posts: postsRes.count ?? 0 }
    },
    enabled: !!user,
  })

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        company_name: profile.company_name || '',
      })
    }
  }, [profile])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) return
      const { error } = await supabase
          .from('users')
          .update({
            display_name: form.display_name.trim() || null,
            bio: form.bio.trim() || null,
            location: form.location.trim() || null,
            company_name: form.company_name?.trim() || null,
          })
          .eq('id', user.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Profile saved ✨', { description: 'Your profile has been updated successfully.' })
      setEditing(false)
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
    },
    onError: () => toast.error('Update failed', { description: 'Could not save your profile. Please try again.' }),
  })

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image too large', { description: 'Please choose an image under 5 MB.' }); return }
    setUploading(true)
    
    let uploadFile = file
    try {
      uploadFile = await compressImage(file, 500, 0.8)
    } catch (err) {
      console.error('Image compression failed, using original', err)
    }

    const path = `avatars/${user.id}/${Date.now()}.jpg`
    const { error } = await supabase.storage.from('user-content').upload(path, uploadFile, { upsert: true, cacheControl: '31536000' })
    if (error) { toast.error('Upload failed', { description: 'Could not upload your avatar. Please try again.' }); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('user-content').getPublicUrl(path)
    await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id)
    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })
    queryClient.invalidateQueries({ queryKey: ['my-profile'] })
    toast.success('Avatar updated! 📸', { description: 'Your new profile picture is now live.' })
    setUploading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  async function handleShareProfile() {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/u/${profile?.username}`
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied! 🔗', { description: 'Share your Revoluzion profile with the community.' })
      } catch {
        toast.error('Could not copy link to clipboard')
      }
    } else if (typeof window !== 'undefined') {
      window.open(url, '_blank')
    } else {
      toast.error('Copy not available in this environment')
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-4 bg-surface-variant rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted px-4">
        <User size={48} className="mb-4 opacity-30" />
        <p className="text-lg mb-2">Sign in to view your profile</p>
        <a href="/login" className="btn-primary mt-4">Sign In</a>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-1">

      {/* -- Profile Header -- */}
      <div className="flex flex-col items-center py-6 gap-3">
        <div className="relative">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.display_name || 'Avatar'}
              width={88}
              height={88}
              className="rounded-full object-cover border-2 border-primary"
              style={{ width: 88, height: 88 }}
            />
          ) : (
            <DefaultAvatar
              className="rounded-full border-2 border-primary"
              style={{ width: 88, height: 88 }}
            />
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-primary flex items-center justify-center hover:opacity-80 transition-opacity"
            aria-label="Change avatar"
          >
            <Camera size={13} className="text-black" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-xl font-bold text-text-primary">
              {profile?.display_name || profile?.username}
            </span>
            {profile?.is_verified && (
              <span className="text-primary text-base leading-none">✓</span>
            )}
          </div>
          <div className="text-sm text-primary mt-0.5">@{profile?.username}</div>
        </div>
      </div>

      {/* -- Stats Row -- */}
      <div className="card flex divide-x divide-border">
        <StatCell value={stats?.builds ?? 0} label="Builds" />
        <StatCell value={stats?.posts ?? 0} label="Posts" />
        <StatCell value={profile?.followers_count ?? 0} label="Followers" />
        <StatCell value={profile?.following_count ?? 0} label="Following" />
      </div>

      {/* -- Action Buttons -- */}
      <div className="flex gap-2.5 pt-3 pb-1">
        <ActionBtn label="Edit Profile" icon={<Edit2 size={14} />} onClick={() => setEditing(true)} />
        <ActionBtn label="Share Profile" icon={<Share2 size={14} />} onClick={handleShareProfile} />
        <ActionBtn label="Get App" icon={<Smartphone size={14} />} onClick={() => { if (typeof window !== 'undefined') window.open('https://revoluzion.my', '_blank') }} />
      </div>

      {/* -- Bio and Location -- */}
      {(profile?.bio || profile?.location) && !editing && (
        <div className="pt-2 pb-1 space-y-1.5">
          {profile.bio && (
            <div className="flex gap-2 items-start">
              <FileText size={13} className="text-primary shrink-0 mt-0.5" />
              <p className="text-text-secondary text-sm leading-relaxed">{profile.bio}</p>
            </div>
          )}
          {profile.location && (
            <div className="flex items-center gap-2">
              <MapPin size={13} className="text-primary" />
              <span className="text-text-muted text-sm">{profile.location}</span>
            </div>
          )}
        </div>
      )}

      {/* -- Edit Profile Form -- */}
      {editing && (
        <div className="card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text-primary">Edit Profile</span>
            <button
              onClick={() => setEditing(false)}
              className="p-1 rounded text-text-muted hover:text-text-primary transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Display Name</label>
            <input
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              className="input"
              placeholder="Your display name"
              maxLength={50}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="input resize-none min-h-[90px]"
              placeholder="Tell the community about yourself..."
              maxLength={300}
            />
            <div className="text-right text-text-muted text-xs mt-0.5">{form.bio.length}/300</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="input"
              placeholder="Kuala Lumpur, Malaysia"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Company Name</label>
            <input
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              className="input"
              placeholder="Company or business name (optional)"
              maxLength={150}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Save size={14} />
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => setEditing(false)} className="btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* -- MY GARAGE -- */}
      <SectionLabel label="MY GARAGE" />
      <NavCard rows={[
        { icon: <Car size={18} />, label: 'My Garage', href: '/garage' },
        { icon: <Wrench size={18} />, label: 'My Builds', href: '/builds' },
        { icon: <Store size={18} />, label: 'Marketplace Listings', href: '/marketplace' },
      ]} />

      {/* -- ACTIVITY -- */}
      <SectionLabel label="ACTIVITY" />
      <NavCard rows={[
        { icon: <CalendarDays size={18} className="text-teal-400" />, label: 'My Events', href: '/events' },
      ]} />

      {/* -- MY SHOP -- */}
      <SectionLabel label="MY SHOP" />
      <NavCard rows={[
        { icon: <ShoppingCart size={18} className="text-primary" />, label: 'My Cart', href: '/shop/cart' },
        { icon: <Truck size={18} className="text-teal-400" />, label: 'Track Orders', href: '/shop/orders' },
        { icon: <ScrollText size={18} className="text-yellow-400" />, label: 'Order History', href: '/shop/orders' },
        { icon: <Heart size={18} className="text-red-400" />, label: 'Wishlist', href: '/shop/wishlist' },
      ]} />

      {/* -- ACCOUNT -- */}
      <SectionLabel label="ACCOUNT" />
      <NavCard rows={[
        { icon: <Settings size={18} />, label: 'Account Settings', href: '/profile/settings' },
        { icon: <Bell size={18} />, label: 'Notifications', href: '/notifications' },
        { icon: <Lock size={18} />, label: 'Privacy and Security', href: '/profile/settings' },
      ]} />
      <div className="pt-1.5 pb-1">
        <button
          onClick={() => setSignOutOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 card rounded-xl text-error hover:bg-surface-variant transition-colors text-sm font-medium"
        >
          <LogOut size={18} className="text-error" />
          Sign Out
        </button>
      </div>

      {/* -- SUPPORT AND INFO -- */}
      <SectionLabel label="SUPPORT & INFO" />
      <NavCard rows={[
        { icon: <HelpCircle size={18} />, label: 'Help & Support', onClick: () => setHelpOpen(true) },
        { icon: <Bug size={18} />, label: 'Report a Bug', onClick: () => setBugOpen(true) },
        { icon: <ScrollText size={18} />, label: 'Terms of Service', href: '/legal/terms' },
        { icon: <Shield size={18} />, label: 'Privacy Policy', href: '/legal/privacy' },
      ]} />

      <div className="pb-8" />

      {helpOpen && (
        <BottomSheet title="HELP & SUPPORT" onClose={() => setHelpOpen(false)}>
          <SheetRow
            icon={<MessageSquare size={18} className="text-primary" />}
            label="Message Support"
            sub="Chat with us in-app"
            onClick={() => { setHelpOpen(false); router.push('/chat') }}
          />
          <SheetRow
            icon={<Mail size={18} className="text-teal-400" />}
            label="Email Support"
            sub="hello@revoluzion.my"
            onClick={() => { if (typeof window !== 'undefined') window.location.href = 'mailto:hello@revoluzion.my?subject=App%20Support' }}
          />
          <SheetRow
            icon={<Globe size={18} className="text-teal-400" />}
            label="Visit Website"
            sub="revoluzion.my"
            onClick={() => window.open('https://revoluzion.my', '_blank')}
          />
        </BottomSheet>
      )}

      {bugOpen && (
        <BottomSheet title="REPORT A BUG" subtitle="Found something broken? Let us know." onClose={() => setBugOpen(false)}>
          <SheetRow
            icon={<MessageSquare size={18} className="text-primary" />}
            label="Message Support"
            sub="Describe the bug in-app chat"
            onClick={() => { setBugOpen(false); router.push('/chat') }}
          />
          <SheetRow
            icon={<Mail size={18} className="text-teal-400" />}
            label="Email Report"
            sub="hello@revoluzion.my"
            onClick={() => { if (typeof window !== 'undefined') window.location.href = 'mailto:hello@revoluzion.my?subject=Bug%20Report%20-%20Revoluzion%20Web' }}
          />
        </BottomSheet>
      )}

      {signOutOpen && (
        <BottomSheet title="SIGN OUT" subtitle="Are you sure you want to sign out?" onClose={() => setSignOutOpen(false)}>
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setSignOutOpen(false)}
              className="flex-1 py-2.5 border border-border rounded-lg text-sm text-text-secondary hover:bg-surface-variant transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSignOut}
              className="flex-1 py-2.5 bg-error/10 border border-error/30 rounded-lg text-sm text-error font-semibold hover:bg-error/20 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}

// -- Sub-components --

function StatCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex-1 flex flex-col items-center py-3.5 gap-0.5">
      <span className="text-lg font-bold text-primary">{value}</span>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  )
}

function ActionBtn({
  label, icon, onClick,
}: {
  label: string; icon: React.ReactNode; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 h-10 border border-border-light bg-surface-light rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors text-xs font-semibold"
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-1 pt-4 pb-1.5">
      <span
        className="text-xs font-bold tracking-widest gradient-text"
        style={{ fontFamily: 'var(--font-orbitron)' }}
      >
        {label}
      </span>
    </div>
  )
}

type NavRow = { icon: React.ReactNode; label: string; href?: string; onClick?: () => void }

function NavCard({ rows }: { rows: NavRow[] }) {
  return (
    <div className="card divide-y divide-border overflow-hidden">
      {rows.map((row, i) => {
        const inner = (
          <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-variant transition-colors w-full">
            <span className="text-text-secondary shrink-0">{row.icon}</span>
            <span className="flex-1 text-sm font-medium text-text-secondary text-left">{row.label}</span>
            <ChevronRight size={15} className="text-text-muted shrink-0" />
          </div>
        )
        if (row.href) return <Link key={i} href={row.href} className="block">{inner}</Link>
        return <button key={i} className="w-full" onClick={row.onClick}>{inner}</button>
      })}
    </div>
  )
}

function BottomSheet({
  title, subtitle, onClose, children,
}: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border rounded-t-2xl p-6 space-y-3 max-w-lg mx-auto">
        <div>
          <span
            className="text-base font-bold gradient-text"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            {title}
          </span>
          {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
        </div>
        <div className="border-t border-border pt-3 space-y-0">
          {children}
        </div>
      </div>
    </>
  )
}

function SheetRow({
  icon, label, sub, onClick,
}: {
  icon: React.ReactNode; label: string; sub: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 px-2 hover:bg-surface-variant rounded-lg transition-colors text-left"
    >
      {icon}
      <div>
        <div className="text-sm font-medium text-text-primary">{label}</div>
        <div className="text-xs text-text-muted">{sub}</div>
      </div>
    </button>
  )
}