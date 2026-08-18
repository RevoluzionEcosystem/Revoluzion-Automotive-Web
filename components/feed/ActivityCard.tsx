'use client'

import Link from 'next/link'
import {
  Car,
  Wrench,
  CalendarDays,
  ShoppingBag,
  Radio,
  UserPlus,
  ArrowUpRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { SafeImage } from '@/components/ui/SafeImage'
import { InlineCommentSection } from '@/components/ui/InlineCommentSection'
import { timeAgo } from '@/lib/utils'
import { wasEdited, type FeedItem, type FeedType } from './types'

type ActivityType = Exclude<FeedType, 'post'>

interface TypeMeta {
  icon: LucideIcon
  iconClass: string
  badgeClass: string
  freshAction: string
  updatedAction: string
}

const TYPE_META: Record<ActivityType, TypeMeta> = {
  car: {
    icon: Car,
    iconClass: 'text-blue-400',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    freshAction: 'added a new car collection',
    updatedAction: 'updated their car specs',
  },
  build: {
    icon: Wrench,
    iconClass: 'text-amber-400',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    freshAction: 'published a custom build log',
    updatedAction: 'modified custom build details',
  },
  event: {
    icon: CalendarDays,
    iconClass: 'text-violet-400',
    badgeClass: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    freshAction: 'scheduled an event',
    updatedAction: 'rescheduled an event',
  },
  listing: {
    icon: ShoppingBag,
    iconClass: 'text-emerald-400',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    freshAction: 'listed an item for sale',
    updatedAction: 'updated a classified listing',
  },
  service: {
    icon: Radio,
    iconClass: 'text-teal-400',
    badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    freshAction: 'registered an automotive service',
    updatedAction: 'updated their service listing',
  },
  user: {
    icon: UserPlus,
    iconClass: 'text-zinc-400',
    badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
    freshAction: 'joined the community',
    updatedAction: 'joined the community',
  },
}

const LABELS: Record<ActivityType, string> = {
  car: 'GARAGE',
  build: 'BUILD',
  event: 'EVENT',
  listing: 'FOR SALE',
  service: 'SERVICE',
  user: 'MEMBER',
}

export function ActivityCard({ item, currentUserId }: { item: FeedItem; currentUserId: string | null }) {
  const type = item.feedType as ActivityType
  const meta = TYPE_META[type]
  const m = item.metadata
  const hasUpdated = wasEdited(item)
  const name = m.display_name || m.username || 'Member'
  const username = m.username ?? undefined
  const action = hasUpdated ? meta.updatedAction : meta.freshAction
  const timeLabel = hasUpdated ? item.updated_at! : item.created_at

  return (
    <article className="rounded-xl border border-white/6 bg-gradient p-4 sm:p-5 mb-4 shadow-xl transition-all duration-300 hover:border-white/10 hover:-translate-y-0.5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start gap-3">
        <UserAvatar src={m.avatar_url} name={name} className="w-9 h-9" href={username ? `/u/${username}` : null} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap leading-tight">
            <Link href={`/u/${username ?? item.user_id}`} className="font-semibold text-text-primary text-sm hover:text-primary transition-colors truncate">
              {name}
            </Link>
            <span className="text-text-muted text-sm">{action}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-text-muted">
            <span>{timeAgo(timeLabel)}</span>
            {hasUpdated && (
              <span className="text-primary font-mono text-[9px] uppercase tracking-wider font-bold">· edited</span>
            )}
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider font-mono ${meta.badgeClass}`}>
          <meta.icon size={11} className={meta.iconClass} />
          {LABELS[type]}
        </span>
      </div>

      {/* Body */}
      {type !== 'user' && (
        <div className="flex items-center justify-between gap-4 border-t border-border/40 mt-3.5 pt-3.5">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Link href={username ? `/u/${username}` : '#'} className="block font-bold text-sm uppercase text-white hover:text-primary leading-tight font-mono tracking-wide truncate">
            {type === 'car' && `${m.year ?? ''} ${m.make ?? ''} ${m.model ?? ''}`.trim()}
            {type === 'build' && `BUILD: ${m.title ?? 'Untitled'}`}
            {type === 'event' && `UPCOMING: ${m.title ?? 'Untitled'}`}
            {type === 'listing' && `FOR SALE: ${m.title ?? 'Untitled'}`}
            {type === 'service' && `SERVICE: ${m.title ?? 'Untitled'}`}
          </Link>

          {item.content && <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{item.content}</p>}

          {/* Extra meta chips */}
          {type === 'build' && m.mods && m.mods.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {m.mods.slice(0, 5).map((mod) => (
                <span key={mod} className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-mono text-primary uppercase font-bold tracking-wider">
                  {mod}
                </span>
              ))}
            </div>
          )}

          {type === 'event' && m.location && <p className="text-xs text-text-secondary font-sans">Location: {m.location}</p>}
          {type === 'listing' && <p className="text-xs text-text-muted">Condition: {m.condition ?? '—'}</p>}
          {type === 'service' && m.location && <p className="text-xs text-text-muted">Area: {m.location}</p>}
        </div>

        {/* Thumbnail or CTA cluster */}
        {item.image_url && (type === 'car' || type === 'build') ? (
          <div className="h-16 w-24 bg-surface rounded-lg border border-border shrink-0 overflow-hidden relative shadow-lg">
            <SafeImage src={item.image_url} alt="" fill className="object-cover" />
          </div>
        ) : (
          <div className="shrink-0 flex flex-col items-end gap-2">
            {type === 'listing' && m.price != null && (
              <span className="text-sm text-primary font-mono font-black whitespace-nowrap">RM {m.price}</span>
            )}
            {type === 'event' && (
              <Link href="/events" className="h-8 px-3 rounded-lg border border-border hover:border-border-light font-mono text-[9px] font-black text-white hover:bg-surface-variant inline-flex items-center uppercase tracking-widest gap-1">
                RSVP <ArrowUpRight size={11} />
              </Link>
            )}
            {type === 'listing' && (
              <Link href={`/marketplace/${item.id}`} className="h-8 px-3 rounded-lg border border-border hover:border-border-light font-mono text-[9px] font-black text-white hover:bg-surface-variant inline-flex items-center uppercase tracking-widest gap-1">
                View Deal <ArrowUpRight size={11} />
              </Link>
            )}
            {type === 'service' && (
              <Link href={`/services/${item.id}`} className="h-8 px-3 rounded-lg border border-border hover:border-border-light font-mono text-[9px] font-black text-white hover:bg-surface-variant inline-flex items-center uppercase tracking-widest gap-1">
                View Directory <ArrowUpRight size={11} />
              </Link>
            )}
          </div>
        )}
        </div>
      )}

      {type !== 'user' && <InlineCommentSection itemId={item.id} feedType={type} currentUserId={currentUserId} />}
    </article>
  )
}
