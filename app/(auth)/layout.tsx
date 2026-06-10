import { type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="flex flex-col items-center gap-3 mb-8" style={{ textDecoration: 'none' }}>
        <div className="relative flex items-center justify-center w-36 h-36">
          {/* Radial glow behind logo */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.17) 0%, rgba(20,184,166,0.04) 50%, transparent 75%)',
              transform: 'scale(1.6)',
            }}
          />
          <Image src="/logo.png" alt="Revoluzion Automotive" width={100} height={100} className="relative object-contain drop-shadow-[0_0_14px_rgba(6,182,212,0.35)]" priority />
        </div>
        <div
          className="font-black text-2xl tracking-widest gradient-text uppercase text-center leading-tight"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          <div>Revoluzion</div>
          <div className="text-xl">Automotive</div>
        </div>
      </Link>
      {children}
    </div>
  )
}
