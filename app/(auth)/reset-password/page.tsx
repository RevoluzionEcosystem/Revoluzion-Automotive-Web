'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword]               = useState('')
  const [confirm, setConfirm]                 = useState('')
  const [showPassword, setShowPassword]       = useState(false)
  const [showConfirm, setShowConfirm]         = useState(false)
  const [loading, setLoading]                 = useState(false)
  const [sessionReady, setSessionReady]       = useState(false)
  const [invalidLink, setInvalidLink]         = useState(false)
  const router  = useRouter()
  const supabase = createClient()

  // With PKCE the code is exchanged server-side (auth/callback), so the session
  // is already in the cookie — just check it directly.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
      } else {
        setInvalidLink(true)
      }
    })
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error('Failed to update password', { description: error.message })
    } else {
      toast.success('Password updated!', { description: 'You can now sign in with your new password.' })
      await supabase.auth.signOut()
      router.push('/login')
    }
    setLoading(false)
  }

  if (invalidLink) {
    return (
      <div className="w-full max-w-sm">
        <div className="card p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-error/15 border border-error/30 flex items-center justify-center mx-auto">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-error">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h1 className="text-lg font-bold text-text-primary">Invalid or expired link</h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            This password reset link has expired or already been used. Please request a new one.
          </p>
          <a
            href="/forgot-password"
            className="btn-primary w-full flex items-center justify-center py-2.5 mt-2"
            style={{ textDecoration: 'none' }}
          >
            Request New Link
          </a>
        </div>
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="w-full max-w-sm">
        <div className="card p-8 flex items-center justify-center min-h-45">
          <div className="flex flex-col items-center gap-3 text-text-muted">
            <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <span className="text-sm">Verifying reset link…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="card p-8">
        <h1 className="text-center text-text-muted text-xs mb-1">Set new password</h1>
        <p className="text-center text-text-muted text-xs mb-7 leading-relaxed">
          Choose a strong password for your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">New Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-9 pr-10"
                placeholder="Min. 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Confirm Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input pl-9 pr-10"
                placeholder="Repeat password"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirm && password !== confirm && (
              <p className="text-xs text-error mt-1.5">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || (confirm.length > 0 && password !== confirm)}
            className="btn-primary w-full py-3 text-base font-semibold"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
