'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { LogOut, ArrowRightCircle, Sparkles, Send, Trash2 } from 'lucide-react'

interface ActionsProps {
    clubId: string
    userId?: string
    isMember: boolean
    role?: string
    postId?: string
    writePostOnly?: boolean
    deletePostOnly?: boolean
}

export function ClubActionsClient({
    clubId,
    userId,
    isMember,
    role,
    postId,
    writePostOnly = false,
    deletePostOnly = false,
}: ActionsProps) {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [postContent, setPostContent] = useState('')

    async function handleJoin() {
        if (!userId) {
            toast.error('Please sign in to join clubs')
            return
        }
        setLoading(true)
        try {
            // 1. Add as member
            const { error } = await supabase.from('car_club_members').insert({
                club_id: clubId,
                user_id: userId,
                role: 'member',
            })
            if (error) throw error

            // 2. Increment member_count on car_clubs
            await supabase.rpc('increment_club_members', { club_id: clubId })

            toast.success('Successfully joined the club!')
            router.refresh()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            toast.error('Failed to join', { description: message })
        } finally {
            setLoading(false)
        }
    }

    async function handleLeave() {
        if (!userId) return
        setLoading(true)
        try {
            // 1. Delete member record
            const { error } = await supabase
                .from('car_club_members')
                .delete()
                .eq('club_id', clubId)
                .eq('user_id', userId)

            if (error) throw error

            // 2. Decrement member_count on car_clubs
            await supabase.rpc('decrement_club_members', { club_id: clubId })

            toast.success('You have left the club.')
            router.refresh()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            toast.error('Failed to leave club', { description: message })
        } finally {
            setLoading(false)
        }
    }

    async function handleCreatePost(e: React.FormEvent) {
        e.preventDefault()
        if (!postContent.trim() || !userId) return
        setLoading(true)

        try {
            const { error } = await supabase.from('car_club_posts').insert({
                club_id: clubId,
                user_id: userId,
                content: postContent.trim(),
            })

            if (error) throw error

            toast.success('Post published to board!')
            setPostContent('')
            router.refresh()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            toast.error('Failed to make post', { description: message })
        } finally {
            setLoading(false)
        }
    }

    async function handleDeletePost() {
        if (!postId) return
        if (!confirm('Are you sure you want to delete this post?')) return
        setLoading(true)

        try {
            const { error } = await supabase
                .from('car_club_posts')
                .delete()
                .eq('id', postId)

            if (error) throw error

            toast.success('Post removed!')
            router.refresh()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            toast.error('Could not delete post', { description: message })
        } finally {
            setLoading(false)
        }
    }

    // Render Delete Post button only
    if (deletePostOnly) {
        return (
            <button
                type="button"
                disabled={loading}
                onClick={handleDeletePost}
                className="p-1 rounded-lg border border-slate-900/60 bg-transparent hover:border-rose-500/20 text-text-disabled hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4"
            >
                <Trash2 size={13} />
            </button>
        )
    }

    // Render Write Post box only
    if (writePostOnly) {
        return (
            <form onSubmit={handleCreatePost} className="p-4 bg-slate-900/20 border border-slate-800 rounded-2xl space-y-3">
                <textarea
                    placeholder="Share some updates, specs, or local car meets with your club members..."
                    rows={3}
                    required
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    className="input w-full text-xs py-2.5 resize-none bg-black/20"
                />
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading || !postContent.trim()}
                        className="px-4 py-2 bg-primary hover:opacity-90 text-black font-bold uppercase tracking-wider text-[10px] rounded-xl flex items-center gap-1.5 transition-all"
                        style={{ fontFamily: 'var(--font-orbitron)' }}
                    >
                        <Send size={11} className="stroke-[2.5]" /> Post Bulletin
                    </button>
                </div>
            </form>
        )
    }

    // Render Header Actions (Join/Leave)
    return (
        <>
            {isMember ? (
                role !== 'owner' ? (
                    <button
                        type="button"
                        disabled={loading}
                        onClick={handleLeave}
                        className="h-9 px-4 rounded-xl border border-rose-500/20 hover:border-rose-500 bg-rose-500/5 text-rose-400 font-bold uppercase text-[10px] tracking-wider transition-all flex items-center gap-1.5"
                        style={{ fontFamily: 'var(--font-orbitron)' }}
                    >
                        <LogOut size={12} /> Leave Club
                    </button>
                ) : (
                    <span
                        className="h-9 px-4 rounded-xl border border-primary/20 bg-primary/5 text-primary font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5"
                        style={{ fontFamily: 'var(--font-orbitron)' }}
                    >
                        <Sparkles size={12} /> Founder Owner
                    </span>
                )
            ) : (
                <button
                    type="button"
                    disabled={loading}
                    onClick={handleJoin}
                    className="h-9 px-5 btn-primary rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all flex items-center gap-1.5"
                    style={{ fontFamily: 'var(--font-orbitron)' }}
                >
                    <ArrowRightCircle size={13} className="stroke-[2.5]" /> Join Club
                </button>
            )}
        </>
    )
}
