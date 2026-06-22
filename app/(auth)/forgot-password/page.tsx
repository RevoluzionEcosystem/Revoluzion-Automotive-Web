'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')

    const generateState = (len = 16) => {
      const arr = new Uint8Array(len)
      window.crypto.getRandomValues(arr)
      return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('')
    }
    const state = generateState(18)
    const secureFlag = baseUrl.startsWith('https:') ? 'Secure; ' : ''
    document.cookie = `rev_oauth_state=${state}; Path=/; SameSite=Lax; Max-Age=600; ${secureFlag}`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/auth/callback?type=recovery&state=${state}`,
    })
    if (error) {
      toast.error('Failed to send reset email', { description: error.message })
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-sm">
      <div className="card p-8">
        {sent ? (
          <div className="text-center space-y-4">
            {/* Check icon */}
            <div className="w-14 h-14 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-text-primary">Check your email</h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              We sent a password reset link to <span className="text-text-primary font-medium">{email}</span>.
              The link expires in 1 hour.
            </p>
            <p className="text-xs text-text-muted pt-2">
              Didn&apos;t receive it? Check your spam folder or{' '}
              <button
                onClick={() => setSent(false)}
                className="text-primary hover:text-primary/80 transition-colors underline underline-offset-2"
              >
                try again
              </button>
              .
            </p>
            <Link
              href="/login"
              className="btn-secondary w-full flex items-center justify-center gap-2 mt-2 py-2.5"
              style={{ textDecoration: 'none' }}
            >
              <ArrowLeft size={15} />
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-center text-text-muted text-xs mb-3">Forgot your password?</h1>
            <p className="text-center text-text-muted text-xs mb-10 leading-relaxed">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
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

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base font-semibold"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-text-muted text-xs hover:text-text-secondary transition-colors flex items-center justify-center gap-1.5"
                style={{ textDecoration: 'none' }}
              >
                <ArrowLeft size={13} />
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
