'use client'

import { motion } from 'framer-motion'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Outer glow ring */}
      <div className="relative flex items-center justify-center mb-8">
        <motion.div
          className="absolute rounded-full border-2 border-primary/30"
          style={{ width: 100, height: 100 }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full border border-primary/20"
          style={{ width: 130, height: 130 }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />

        {/* Logo circle */}
        <motion.div
          className="relative flex items-center justify-center w-20 h-20 rounded-full bg-surface border border-primary/40"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ boxShadow: '0 0 30px rgba(6,182,212,0.25)' }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" stroke="#06B6D4" strokeWidth="1.5" strokeOpacity="0.4" />
            <path
              d="M10 20 L20 8 L30 20 L20 32 Z"
              stroke="#06B6D4"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M15 20 L20 13 L25 20 L20 27 Z"
              fill="#06B6D4"
              fillOpacity="0.8"
            />
          </svg>
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
        transition={{ delay: 0.4 }}
      >
        <motion.div
          className="h-full bg-gradient-cyan rounded-full"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  )
}
