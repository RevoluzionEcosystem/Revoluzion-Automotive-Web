'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'

const LS_KEY = 'ra_wishlist_v1'

function lsGet(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') } catch { return [] }
}
function lsSet(ids: string[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(ids))
}

interface WishlistContextType {
  productIds: Set<string>
  toggle: (productId: string) => Promise<void>
  isWishlisted: (productId: string) => boolean
}

const WishlistContext = createContext<WishlistContextType | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [productIds, setProductIds] = useState<Set<string>>(new Set())
  const userIdRef = useRef<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false
    async function boot() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (user) {
        userIdRef.current = user.id
        const { data } = await supabase
          .from('wishlists')
          .select('product_id')
          .eq('user_id', user.id)
        if (!cancelled) setProductIds(new Set(data?.map((r) => r.product_id) ?? []))
        // Realtime sync for wishlist changes across tabs/devices
        if (!cancelled) {
          supabase.channel(`wishlist:${user.id}`)
            .on('postgres_changes', {
              event: '*', schema: 'public', table: 'wishlists',
              filter: `user_id=eq.${user.id}`,
            }, async () => {
              const { data: fresh } = await supabase.from('wishlists').select('product_id').eq('user_id', user.id)
              setProductIds(new Set(fresh?.map((r) => r.product_id) ?? []))
            })
            .subscribe()
        }
      } else {
        setProductIds(new Set(lsGet()))
      }
    }
    boot()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggle = useCallback(async (productId: string) => {
    const userId = userIdRef.current
    setProductIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      if (!userId) lsSet([...next])
      return next
    })
    if (userId) {
      const { data: existing } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle()
      if (existing) {
        await supabase.from('wishlists').delete().eq('user_id', userId).eq('product_id', productId)
      } else {
        await supabase.from('wishlists').insert({ user_id: userId, product_id: productId })
      }
    }
  }, [supabase])

  const isWishlisted = useCallback((id: string) => productIds.has(id), [productIds])

  return (
    <WishlistContext.Provider value={{ productIds, toggle, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider')
  return ctx
}
