'use client'

import { useEffect } from 'react'
import { useCart } from '@/lib/shop/cart-context'

export function ClearCartOnSuccess() {
  const { clearCart } = useCart()
  useEffect(() => {
    clearCart()
  }, []) // eslint-disable-line
  return null
}