import { cn } from '@/lib/utils'
import type { CSSProperties } from 'react'

interface DefaultAvatarProps {
  className?: string
  style?: CSSProperties
}

/**
 * Faceless person silhouette avatar — used when no profile photo is available.
 * Pass size via className (e.g. "w-10 h-10"). Border and bg are included by default.
 * Override border with e.g. "border-2 border-primary".
 */
export function DefaultAvatar({ className, style }: DefaultAvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full overflow-hidden shrink-0 bg-primary/10 border border-primary/30',
        className,
      )}
      style={style}
    >
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* head */}
        <circle cx="20" cy="14" r="7" fill="#06B6D4" fillOpacity="0.85" />
        {/* shoulders — extends beyond viewBox, clipped by parent overflow-hidden */}
        <path d="M0 42 C0 28 40 28 40 42 Z" fill="#06B6D4" fillOpacity="0.85" />
      </svg>
    </div>
  )
}
