'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { CartProvider } from '@/lib/shop/cart-context'
import { WishlistProvider } from '@/lib/shop/wishlist-context'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,       // data stays fresh for 5 min — fewer round-trips
            gcTime: 10 * 60 * 1000,          // keep unused cache for 10 min before GC
            refetchOnWindowFocus: false,     // don't re-fetch every tab switch
            refetchOnReconnect: 'always',    // but do re-fetch on reconnect
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <WishlistProvider>
          {children}
          <Toaster
            theme="dark"
            position="bottom-center"
            richColors
            expand
            visibleToasts={5}
            toastOptions={{
              style: {
                background: '#111111',
                border: '1px solid #1F2937',
                color: '#F9FAFB',
                fontFamily: 'var(--font-inter)',
              },
              duration: 4000,
            }}
          />
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </WishlistProvider>
      </CartProvider>
    </QueryClientProvider>
  )
}
