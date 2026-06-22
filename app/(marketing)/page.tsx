'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function SplashPage() {
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Double-RAF ensures the initial hidden state is painted before animating in
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => setVisible(true))
    )

    // After 1.4s check auth and redirect (bar transition is 1.3s linear)
    const timer = setTimeout(async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      router.replace(session ? '/feed' : '/login')
    }, 1400)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.09) 0%, transparent 70%)' }}
      />

      {/* Logo */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.65)',
          transition: 'opacity 700ms ease-out, transform 700ms cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div
          className="flex items-center justify-center"
          style={{ filter: 'drop-shadow(0 0 28px rgba(6,182,212,0.35))' }}
        >
          <Image
            src="/logo.png"
            alt="Revoluzion Automotive"
            width={112}
            height={112}
            priority
          />
        </div>
      </div>

      {/* Brand name */}
      <div
        className="mt-7 text-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity 600ms ease-out, transform 600ms ease-out',
          transitionDelay: '200ms',
        }}
      >
        <h1
          className="gradient-text font-black tracking-[0.12em] text-lg uppercase"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          Revoluzion Automotive
        </h1>
      </div>

      {/* Tagline */}
      <div
        className="mt-2"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 600ms ease-out',
          transitionDelay: '400ms',
        }}
      >
        <p className="text-text-muted text-xs tracking-[0.2em] uppercase text-center">
          The Automotive Community
        </p>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
        <div
          style={{
            height: '100%',
            width: visible ? '100%' : '0%',
            transition: 'width 1300ms linear',
            background: 'linear-gradient(90deg, #3B82F6, #06B6D4, #14B8A6)',
          }}
        />
      </div>
    </div>
  )
}
