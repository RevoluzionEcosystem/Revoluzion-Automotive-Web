import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Home, Rss } from 'lucide-react'

export const metadata: Metadata = {
  title: '404 — Page Not Found',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center overflow-hidden relative">

      {/* Background glow blobs */}
      <div
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute bottom-10 right-1/4 w-72 h-72 rounded-full opacity-[0.05]"
        style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)' }}
      />

      {/* Logo */}
      <Link href="/" className="mb-8 block relative group">
        <Image
          src="/logo.png"
          alt="Revoluzion Automotive"
          width={64}
          height={64}
          className="rounded-full group-hover:scale-105 transition-transform duration-300"
          style={{ filter: 'drop-shadow(0 0 20px rgba(6,182,212,0.35))' }}
          priority
        />
      </Link>

      {/* 404 */}
      <div className="relative mb-2">
        <p
          className="font-black leading-none tracking-tighter select-none"
          style={{
            fontFamily: 'var(--font-orbitron)',
            fontSize: 'clamp(6rem, 22vw, 11rem)',
            background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 50%, #14B8A6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 40px rgba(6,182,212,0.3))',
          }}
        >
          404
        </p>
        {/* Reflection / underline accent */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #06B6D4, transparent)' }}
        />
      </div>

      {/* Heading */}
      <h1
        className="mt-6 text-2xl font-bold gradient-text tracking-wide"
        style={{ fontFamily: 'var(--font-orbitron)' }}
      >
        Page Not Found
      </h1>

      <p className="mt-3 text-text-muted text-sm max-w-sm leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>

      {/* Actions */}
      <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="btn-primary inline-flex items-center gap-2 px-7 py-2.5 text-sm"
        >
          <Home size={15} />
          Go Home
        </Link>
        <Link
          href="/feed"
          className="btn-secondary inline-flex items-center gap-2 px-7 py-2.5 text-sm"
        >
          <Rss size={15} />
          Browse Feed
        </Link>
      </div>

      {/* Bottom label */}
      <p
        className="mt-20 text-[10px] tracking-[0.3em] uppercase text-text-muted/50"
        style={{ fontFamily: 'var(--font-orbitron)' }}
      >
        Revoluzion Automotive
      </p>
    </div>
  )
}
