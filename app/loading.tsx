'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Outer glow ring */}
      <div className="relative flex items-center justify-center mb-8">
        <motion.div
          className="absolute rounded-full border-2 border-primary/30"
          style={{ width: 100, height: 100 }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full border border-primary/20"
          style={{ width: 130, height: 130 }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />

        {/* Logo circle */}
        <motion.div
          className="relative flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ filter: 'drop-shadow(0 0 20px rgba(6,182,212,0.35))' }}
        >
          <Image src="/logo.png" alt="Revoluzion Automotive" width={80} height={80} priority />
        </motion.div>
      </div>

      {/* Brand name */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold tracking-widest gradient-text uppercase">
          REVOLUZION
        </h1>
        <p className="text-text-muted text-xs tracking-[0.3em] uppercase mt-1">
          Automotive
        </p>
      </motion.div>

      {/* Loading bar */}
      <motion.div
        className="mt-8 w-48 h-0.5 bg-surface-variant rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className="h-full bg-gradient-cyan rounded-full"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  )
}
