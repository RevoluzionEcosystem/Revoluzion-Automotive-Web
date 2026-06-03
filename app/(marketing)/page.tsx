import Link from 'next/link'
import { ArrowRight, Wrench, CalendarDays, ShoppingBag, Users, Car, MessageSquare } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Revoluzion Automotive — Malaysia\'s Premier Car Community',
  description:
    "Join Malaysia's #1 automotive community. Share builds, discover events, trade parts, and connect with fellow enthusiasts.",
}

const features = [
  {
    icon: Wrench,
    title: 'Showcase Builds',
    description: 'Document and share your car modification journey with the community.',
  },
  {
    icon: CalendarDays,
    title: 'Discover Events',
    description: 'Find car meets, track days, and automotive events across Malaysia.',
  },
  {
    icon: ShoppingBag,
    title: 'Official Shop',
    description: 'Browse merchandise and official Revoluzion products.',
  },
  {
    icon: Car,
    title: 'Marketplace',
    description: 'Buy and sell parts, accessories, and vehicles peer-to-peer.',
  },
  {
    icon: Users,
    title: 'Join Clubs',
    description: 'Find and join clubs based on your car make, style, or region.',
  },
  {
    icon: MessageSquare,
    title: 'Community Chat',
    description: 'Real-time chat with fellow enthusiasts — always on.',
  },
]

const stats = [
  { value: '10K+', label: 'Members' },
  { value: '500+', label: 'Builds' },
  { value: '200+', label: 'Events' },
  { value: '50+', label: 'Clubs' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface border border-primary/50"
              style={{ boxShadow: '0 0 15px rgba(6,182,212,0.3)' }}
            >
              <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                <path d="M10 20 L20 8 L30 20 L20 32 Z" stroke="#06B6D4" strokeWidth="2" fill="none" />
                <path d="M15 20 L20 13 L25 20 L20 27 Z" fill="#06B6D4" fillOpacity="0.9" />
              </svg>
            </div>
            <span className="font-bold text-base tracking-wider gradient-text uppercase">
              Revoluzion
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Join Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-4 relative overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="badge-primary inline-flex mb-6">
            <span>Malaysia&apos;s #1 Automotive Community</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight mb-6">
            <span className="gradient-text">DRIVE YOUR</span>
            <br />
            <span className="text-text-primary">PASSION</span>
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with Malaysia&apos;s finest automotive enthusiasts. Share your builds, discover
            events, trade parts, and be part of a community that lives and breathes cars.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary text-base py-3 px-8 inline-flex items-center gap-2">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link href="/feed" className="btn-secondary text-base py-3 px-8">
              Browse Community
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 max-w-2xl mx-auto">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-black gradient-text">{value}</div>
                <div className="text-text-muted text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Everything for Car Enthusiasts
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              One platform for builds, events, community, and commerce — built by enthusiasts, for enthusiasts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="card-hover p-6 group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="card p-12 relative overflow-hidden"
            style={{ boxShadow: '0 0 60px rgba(6,182,212,0.1)' }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.1) 0%, transparent 60%)',
              }}
            />
            <div className="relative">
              <h2 className="text-3xl font-bold text-text-primary mb-4">
                Ready to Join the Revolt?
              </h2>
              <p className="text-text-secondary mb-8 leading-relaxed">
                Create your free account and start connecting with Malaysia&apos;s automotive community today.
              </p>
              <Link href="/register" className="btn-primary text-base py-3 px-8 inline-flex items-center gap-2">
                Create Free Account <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-text-muted text-sm">
            &copy; {new Date().getFullYear()} Revoluzion Automotive. All rights reserved.
          </span>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <Link href="/legal/terms" className="hover:text-text-secondary transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-text-secondary transition-colors">Privacy</Link>
            <Link href="/legal/community" className="hover:text-text-secondary transition-colors">Community Guidelines</Link>
            <Link href="/about" className="hover:text-text-secondary transition-colors">About</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
