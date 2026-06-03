import { type ReactNode } from 'react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface border border-primary/50"
          style={{ boxShadow: '0 0 20px rgba(6,182,212,0.25)' }}
        >
          <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
            <path d="M10 20 L20 8 L30 20 L20 32 Z" stroke="#06B6D4" strokeWidth="2" fill="none" />
            <path d="M15 20 L20 13 L25 20 L20 27 Z" fill="#06B6D4" fillOpacity="0.9" />
          </svg>
        </div>
        <span className="font-bold text-lg tracking-wider gradient-text uppercase">Revoluzion</span>
      </Link>
      {children}
    </div>
  )
}
