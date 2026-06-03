'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useMutation } from '@tanstack/react-query'
import { User, Lock, Bell, Shield, ChevronRight, AlertCircle, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import type { User as SupabaseUser } from '@supabase/supabase-js'

type Section = 'account' | 'security' | 'notifications'

export default function SettingsPage() {
  const supabase = createClient()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [section, setSection] = useState<Section>('account')
  const [currentEmail, setCurrentEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Notification prefs state
  const [notifPrefs, setNotifPrefs] = useState({
    likes: true,
    comments: true,
    follows: true,
    events: true,
    marketplace: false,
    community: true,
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        setCurrentEmail(user.email ?? '')
      }
    })
  }, [supabase])

  const changeEmailMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Confirmation email sent to ' + newEmail)
      setNewEmail('')
    },
    onError: (err: any) => toast.error(err.message ?? 'Failed to update email'),
  })

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) throw new Error('Passwords do not match')
      if (newPassword.length < 8) throw new Error('Password must be at least 8 characters')
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (err: any) => toast.error(err.message ?? 'Failed to update password'),
  })

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      // Soft-delete — in production this would call a server action / Supabase Edge Function
      throw new Error('Please contact hello@revoluzion.my to delete your account')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const NAV_ITEMS = [
    { id: 'account' as Section, label: 'Account', icon: User },
    { id: 'security' as Section, label: 'Security', icon: Lock },
    { id: 'notifications' as Section, label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
        <Shield size={22} /> Settings
      </h1>

      <div className="grid sm:grid-cols-4 gap-5">
        {/* Sidebar nav */}
        <nav className="sm:col-span-1">
          <div className="card p-2 space-y-0.5">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  section === id
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-variant'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Main content */}
        <div className="sm:col-span-3 space-y-5">
          {section === 'account' && (
            <div className="card p-5">
              <h2 className="font-semibold text-text-primary mb-4">Account Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Current Email</label>
                  <input
                    type="email"
                    value={currentEmail}
                    readOnly
                    className="input w-full opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">New Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email"
                    className="input w-full"
                  />
                </div>

                <button
                  onClick={() => changeEmailMutation.mutate()}
                  disabled={!newEmail || changeEmailMutation.isPending}
                  className="btn-primary px-6"
                >
                  {changeEmailMutation.isPending ? 'Sending...' : 'Update Email'}
                </button>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-medium text-error mb-2 flex items-center gap-2">
                    <AlertCircle size={14} /> Danger Zone
                  </h3>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                        deleteAccountMutation.mutate()
                      }
                    }}
                    className="px-4 py-2 text-sm bg-error/10 text-error border border-error/20 rounded-lg hover:bg-error/20 transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {section === 'security' && (
            <div className="card p-5">
              <h2 className="font-semibold text-text-primary mb-4">Change Password</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="input w-full"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="input w-full"
                    autoComplete="new-password"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-error text-xs mt-1">Passwords do not match</p>
                  )}
                </div>
                <button
                  onClick={() => changePasswordMutation.mutate()}
                  disabled={!newPassword || !confirmPassword || changePasswordMutation.isPending}
                  className="btn-primary px-6"
                >
                  {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                </button>

                <div className="pt-4 border-t border-border">
                  <p className="text-text-muted text-xs">
                    Using Google sign-in? Password changes don&apos;t apply to OAuth accounts.
                  </p>
                </div>
              </div>
            </div>
          )}

          {section === 'notifications' && (
            <div className="card p-5">
              <h2 className="font-semibold text-text-primary mb-4">Notification Preferences</h2>
              <div className="space-y-3">
                {Object.entries(notifPrefs).map(([key, value]) => {
                  const labels: Record<string, string> = {
                    likes: 'Likes on your posts',
                    comments: 'Comments on your posts',
                    follows: 'New followers',
                    events: 'Event reminders & updates',
                    marketplace: 'Marketplace activity',
                    community: 'Community mentions',
                  }
                  return (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <div className="text-sm font-medium text-text-primary">{labels[key] ?? key}</div>
                      </div>
                      <button
                        onClick={() => setNotifPrefs((prev) => ({ ...prev, [key]: !value }))}
                        className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-surface-variant border border-border'}`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : ''}`}
                        />
                      </button>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={() => toast.success('Preferences saved')}
                className="btn-primary px-6 mt-4"
              >
                Save Preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
