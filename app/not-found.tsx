import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 — Page Not Found',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      {/* Logo */}
      <Link href="/" className="mb-10 block">
        <Image
          src="/logo.png"
          alt="Revoluzion Automotive"
          width={72}
          height={72}
          className="rounded-full mx-auto"
          style={{ boxShadow: '0 0 32px rgba(6,182,212,0.35)' }}
          priority
        />
      </Link>

      {/* 404 */}
      <p
        className="font-orbitron font-black text-[7rem] leading-none tracking-tight"
        style={{
          background: 'linear-gradient(135deg, #06B6D4 0%, #14B8A6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        404
      </p>

      {/* Divider line */}
      <div className="mt-4 mb-6 w-16 h-px bg-primary/40" />

      <h1 className="font-orbitron font-semibold text-xl text-text-primary tracking-wide">
        Page Not Found
      </h1>
      <p className="mt-3 text-text-secondary text-sm max-w-xs leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium font-orbitron tracking-wide text-background bg-primary hover:bg-primary-light transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium font-orbitron tracking-wide text-text-primary border border-border hover:border-primary/50 hover:text-primary transition-colors"
        >
          Browse Feed
        </Link>
      </div>

      {/* Bottom label */}
      <p className="mt-16 text-text-muted text-xs tracking-widest uppercase font-orbitron">
        Revoluzion Automotive
      </p>
    </div>
  )
}
