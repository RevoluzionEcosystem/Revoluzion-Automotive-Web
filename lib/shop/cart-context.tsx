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
import type { CartItem } from '@/lib/shop/types'

const LS_KEY = 'ra_cart_v1'

interface CartContextType {
  items: CartItem[]
  totalQty: number
  subtotal: number
  loading: boolean
  addItem: (item: CartItem) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  updateQty: (productId: string, qty: number) => Promise<void>
  clearCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | null>(null)

function lsGet(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as CartItem[] } catch { return [] }
}
function lsSet(items: CartItem[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items))
}

async function getOrCreateCart(supabase: ReturnType<typeof createClient>, userId: string) {
  // Upsert: atomically create or get the single cart for this user
  const { data, error } = await supabase
    .from('carts')
    .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: false })
    .select('id')
    .single()
  if (!error && data) return data.id as string

  // Fallback: fetch existing (upsert may return null for ignoreDuplicates path in some versions)
  const { data: existing } = await supabase
    .from('carts').select('id').eq('user_id', userId)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (existing) return existing.id as string

  // Last resort: insert fresh
  const { data: created } = await supabase.from('carts').insert({ user_id: userId }).select('id').single()
  return created?.id as string
}

async function loadSupabaseCart(supabase: ReturnType<typeof createClient>, cartId: string): Promise<CartItem[]> {
  const { data } = await supabase
    .from('cart_items')
    .select('product_id, quantity, price_snapshot, products(name, sku_public, product_images(url, sort_order))')
    .eq('cart_id', cartId)
  if (!data) return []
  return data.map((row: any) => {
    const p = row.products as Record<string, unknown> | null
    const imgs = (p?.product_images as { url: string; sort_order: number }[] | undefined) ?? []
    const sorted = [...imgs].sort((a, b) => a.sort_order - b.sort_order)
    return {
      productId: row.product_id as string,
      name: (p?.name as string) ?? '',
      sku: (p?.sku_public as string) ?? '',
      imageUrl: sorted[0]?.url ?? null,
      priceSnapshot: row.price_snapshot as number,
      quantity: row.quantity as number,
    }
  })
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  // Use refs for stable references across renders
  const cartIdRef = useRef<string | null>(null)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    let cancelled = false
    async function boot() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return

      if (user) {
        const cartId = await getOrCreateCart(supabase, user.id)
        if (cancelled || !cartId) return
        cartIdRef.current = cartId

        // Merge localStorage into Supabase cart (guest → logged in)
        const localItems = lsGet()
        if (localItems.length > 0) {
          for (const item of localItems) {
            const { data: ex } = await supabase.from('cart_items').select('id, quantity')
              .eq('cart_id', cartId).eq('product_id', item.productId).maybeSingle()
            if (ex) {
              await supabase.from('cart_items').update({ quantity: ex.quantity + item.quantity }).eq('id', ex.id)
            } else {
              await supabase.from('cart_items').insert({
                cart_id: cartId, product_id: item.productId,
                quantity: item.quantity, price_snapshot: item.priceSnapshot,
              })
            }
          }
          lsSet([])
        }

        const loaded = await loadSupabaseCart(supabase, cartId)
        console.log('[Cart] boot: cartId=', cartId, 'items=', loaded.length)
        if (!cancelled) setItems(loaded)

        // Realtime — sync across tabs/devices
        if (!cancelled) {
          supabase.channel(`cart:${cartId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'cart_items', filter: `cart_id=eq.${cartId}` },
              async () => {
                const refreshed = await loadSupabaseCart(supabase, cartId)
                setItems(refreshed)
              })
            .subscribe()
        }
      } else {
        // Guest — use localStorage
        setItems(lsGet())
      }
      if (!cancelled) setLoading(false)
    }
    boot()
    return () => { cancelled = true }
  }, [supabase]) // supabase ref is stable so this only runs once

  const addItem = useCallback(async (item: CartItem) => {
    const cartId = cartIdRef.current

    // Optimistic UI update
    setItems(prev => {
      const idx = prev.findIndex(i => i.productId === item.productId)
      const next = idx >= 0
        ? prev.map((i, j) => j === idx ? { ...i, quantity: i.quantity + item.quantity } : i)
        : [...prev, item]
      if (!cartId) lsSet(next)
      return next
    })

    if (cartId) {
      const { data: existing, error: fetchErr } = await supabase.from('cart_items')
        .select('id, quantity').eq('cart_id', cartId).eq('product_id', item.productId).maybeSingle()

      if (fetchErr) { console.error('[Cart] addItem fetch error:', fetchErr); return }

      if (existing) {
        const { error } = await supabase.from('cart_items')
          .update({ quantity: existing.quantity + item.quantity }).eq('id', existing.id)
        if (error) console.error('[Cart] addItem update error:', error)
        else console.log('[Cart] updated qty for', item.productId, 'cart:', cartId)
      } else {
        const { error } = await supabase.from('cart_items').insert({
          cart_id: cartId, product_id: item.productId,
          quantity: item.quantity, price_snapshot: item.priceSnapshot,
        })
        if (error) console.error('[Cart] addItem insert error:', error)
        else console.log('[Cart] inserted', item.productId, 'cart:', cartId)
      }
    } else {
      console.warn('[Cart] addItem: cartIdRef is null — not logged in or cart not ready')
    }
  }, [supabase])

  const removeItem = useCallback(async (productId: string) => {
    const cartId = cartIdRef.current
    setItems(prev => {
      const next = prev.filter(i => i.productId !== productId)
      if (!cartId) lsSet(next)
      return next
    })
    if (cartId) {
      const { error } = await supabase.from('cart_items').delete()
        .eq('cart_id', cartId).eq('product_id', productId)
      if (error) console.error('[Cart] removeItem error:', error)
    }
  }, [supabase])

  const updateQty = useCallback(async (productId: string, qty: number) => {
    if (qty < 1) return
    const cartId = cartIdRef.current
    setItems(prev => {
      const next = prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i)
      if (!cartId) lsSet(next)
      return next
    })
    if (cartId) {
      const { error } = await supabase.from('cart_items').update({ quantity: qty })
        .eq('cart_id', cartId).eq('product_id', productId)
      if (error) console.error('[Cart] updateQty error:', error)
    }
  }, [supabase])

  const clearCart = useCallback(async () => {
    const cartId = cartIdRef.current
    setItems([])
    lsSet([])
    if (cartId) {
      const { error } = await supabase.from('cart_items').delete().eq('cart_id', cartId)
      if (error) console.error('[Cart] clearCart error:', error)
    }
  }, [supabase])

  const totalQty = items.reduce((s, i) => s + i.quantity, 0)
  const subtotal = items.reduce((s, i) => s + i.priceSnapshot * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, totalQty, subtotal, loading, addItem, removeItem, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}