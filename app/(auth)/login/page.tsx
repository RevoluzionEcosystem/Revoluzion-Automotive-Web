'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Sign in failed', { description: error.message })
    } else {
      toast.success('Welcome back! 👋', { description: 'You are signed in to Revoluzion Automotive.' })
      router.push('/feed')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
  }

  return (
    <div className="w-full max-w-sm">
      <div className="card p-8">
        <h2 className="text-center text-text-muted text-xs mb-8">Sign in to your account</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-9"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-9 pr-10"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors" style={{ textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base font-semibold"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-text-muted text-xs">OR</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full btn-secondary flex items-center justify-center gap-3 py-3"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-text-muted text-xs mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary hover:text-primary/80 transition-colors font-medium" style={{ textDecoration: 'none' }}>
            Sign Up
          </Link>
        </p>

        <p className="text-center mt-4">
          <Link
            href="/feed"
            className="text-text-muted text-sm hover:text-text-secondary transition-colors"
            style={{ textDecoration: 'none' }}
          >
            Continue as Guest
          </Link>
        </p>
      </div>
    </div>
  )
}
