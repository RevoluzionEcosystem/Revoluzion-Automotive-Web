'use client'

import React, { useState } from 'react'
import { DefaultAvatar } from './DefaultAvatar'

interface FallbackAvatarProps {
  src: string | null | undefined
  alt?: string
  className?: string
  fallbackClassName?: string
}

/**
 * Robust avatar component that automatically catches loading errors
 * (e.g., expired Google account picture URLs, network timeouts, invalid domains)
 * and falls back cleanly to the teal silhouette DefaultAvatar.
 */
export function FallbackAvatar({
  src,
  alt = 'Avatar',
  className = '',
  fallbackClassName = ''
}: FallbackAvatarProps) {
  const [error, setError] = useState(false)
  const [lastSrc, setLastSrc] = useState(src)

  // Standard React state adjustment pattern to reset error if src changes
  if (src !== lastSrc) {
    setLastSrc(src)
    setError(false)
  }

  if (error || !src) {
    return <DefaultAvatar className={`${fallbackClassName || className}`} />
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={`${className} object-cover`}
    />
  )
}
