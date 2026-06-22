'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Passwords do not match', { description: 'Make sure both password fields are identical.' })
      return
    }
    // Auto-derive username from email (same logic as mobile)
    const username = email.trim().split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_')
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: displayName || username },
      },
    })

    if (error) {
      toast.error('Registration failed', { description: error.message })
      setLoading(false)
      return
    }

    if (data.user) {
      // Insert profile into users table
      await supabase.from('users').upsert({
        id: data.user.id,
        username: username.toLowerCase(),
        display_name: displayName || username,
      })
      toast.success('Welcome to Revoluzion! 🚗', { description: 'Your account has been created. Let\'s get started!' })
      router.push('/feed')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleGoogleLogin() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')

    const generateState = (len = 16) => {
      const arr = new Uint8Array(len)
      window.crypto.getRandomValues(arr)
      return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('')
    }
    const state = generateState(18)
    const secureFlag = baseUrl.startsWith('https:') ? 'Secure; ' : ''
    document.cookie = `rev_oauth_state=${state}; Path=/; SameSite=Lax; Max-Age=600; ${secureFlag}`

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${baseUrl}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent', state },
      },
    })
  }

  return (
    <div className="w-full max-w-sm">
      <div className="card p-8">
        <h1 className="text-center text-text-muted text-xs mb-8">Join the Revoluzion community</h1>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Display Name</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M12 8v4" /><path d="M8 12h8" /></svg>
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input pl-9"
                placeholder="Your name"
                maxLength={50}
                autoComplete="name"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-9 "
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
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
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Confirm Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input pl-9 pr-10"
                placeholder="Re-enter password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base font-semibold"
          >
            {loading ? 'Creating account...' : 'Create Account'}
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
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" />
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" />
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z" />
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" />
          </svg>
          Sign up with Google
        </button>

        <p className="text-center text-text-muted text-xs mt-5 leading-relaxed">
          By creating an account, you agree to our{' '}
          <Link href="/legal/terms" className="text-primary hover:text-primary/80 transition-colors" style={{ textDecoration: 'none' }}>Terms</Link>
          {' '}and{' '}
          <Link href="/legal/privacy" className="text-primary hover:text-primary/80 transition-colors" style={{ textDecoration: 'none' }}>Privacy Policy</Link>
        </p>

        <p className="text-center text-text-muted text-xs mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-primary/80 transition-colors font-medium" style={{ textDecoration: 'none' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
