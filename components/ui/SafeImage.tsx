'use client'

import React, { useState } from 'react'
import Image, { type ImageProps } from 'next/image'

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string
  fallbackAlt?: string
}

export function SafeImage({
  src,
  alt,
  fallbackSrc = '/cover-image/halfcut-default.jpg',
  fallbackAlt = 'Image unavailable',
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false)
  const [lastSrc, setLastSrc] = useState(src)

  // Standard React state adjustment pattern to reset error if src changes
  if (src !== lastSrc) {
    setLastSrc(src)
    setError(false)
  }

  const [hasError, setHasError] = useState(false)
  const isImageUnavailable = error || hasError || !src

  if (isImageUnavailable) {
    return (
      <div className="relative w-full h-full min-h-inherit bg-black/40 flex items-center justify-center overflow-hidden">
        <Image
          {...props}
          src={fallbackSrc}
          alt={fallbackAlt}
          onError={() => setHasError(true)} // if fallback fails
          fill={props.fill ?? true}
          className={`${props.className || ''} object-cover opacity-60`}
        />
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-3 text-center pointer-events-none gap-1">
          <span className="text-[10px] text-white font-black tracking-widest uppercase bg-black/95 px-2 py-1 rounded border border-slate-700/80 shadow-xl select-none">
            No image
          </span>
        </div>
      </div>
    )
  }

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      onError={() => {
        setError(true)
      }}
    />
  )
}
