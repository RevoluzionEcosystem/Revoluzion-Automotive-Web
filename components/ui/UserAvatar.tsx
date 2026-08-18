'use client'

import Link from 'next/link'
import { SafeImage } from '@/components/ui/SafeImage'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'

interface UserAvatarProps {
  src?: string | null
  name?: string
  className?: string
  href?: string | null
}

/**
 * Circular user avatar with a graceful fallback silhouette.
 * Optionally wraps the avatar in a profile link via `href`.
 * Size is controlled with `className` (e.g. "w-10 h-10").
 */
export function UserAvatar({ src, name = 'User', className = 'w-10 h-10', href }: UserAvatarProps) {
  const circle = src ? (
    <div className={`${className} shrink-0 rounded-full overflow-hidden border border-border relative`}>
      <SafeImage src={src} alt={name} fill className="object-cover" />
    </div>
  ) : (
    <DefaultAvatar className={className} />
  )

  if (href) {
    return (
      <Link href={href} className="shrink-0">
        {circle}
      </Link>
    )
  }
  return circle
}
