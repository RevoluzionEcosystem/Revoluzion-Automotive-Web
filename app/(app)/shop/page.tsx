import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Package, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Shop exclusive Revoluzion merchandise, automotive accessories, and performance parts',
}

export const revalidate = 3600 // ISR — refresh hourly

export default async function ShopPage() {
  const supabase = await createClient()

  // Try to fetch from 'products' table — fall back to static items if table doesn't exist
  let products: any[] = []
  try {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(48)
    products = data ?? []
  } catch {
    products = []
  }

  // Fallback static products if none in DB
  const displayProducts = products.length > 0 ? products : [
    { id: '1', name: 'Revoluzion Classic Tee', price: 59.90, category: 'Apparel', image_url: null, description: 'Premium cotton tee with embroidered logo' },
    { id: '2', name: 'Racing Cap — Cyan Edition', price: 49.90, category: 'Apparel', image_url: null, description: 'Snapback cap with 3D embroidery' },
    { id: '3', name: 'Revoluzion Hoodie', price: 119.90, category: 'Apparel', image_url: null, description: 'Heavyweight 400gsm hoodie' },
    { id: '4', name: 'Sticker Pack Vol.1', price: 19.90, category: 'Accessories', image_url: null, description: '10-piece premium vinyl sticker set' },
    { id: '5', name: 'Phone Mount Pro', price: 89.90, category: 'Accessories', image_url: null, description: 'MagSafe-compatible magnetic mount' },
    { id: '6', name: 'Keyrings Set', price: 29.90, category: 'Accessories', image_url: null, description: 'Zinc alloy car keyring pair' },
  ]

  const categories = ['All', ...new Set(displayProducts.map((p: any) => p.category).filter(Boolean))]

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Shop</h1>
        <p className="text-text-muted text-sm mt-1">Official merchandise & automotive accessories</p>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              cat === 'All'
                ? 'bg-primary text-black border-primary'
                : 'bg-surface text-text-secondary border-border hover:border-primary/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayProducts.map((product: any) => (
          <div key={product.id} className="card-hover group overflow-hidden cursor-pointer">
            {/* Image */}
            <div className="aspect-square bg-surface-variant overflow-hidden relative">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-variant to-background">
                  <Package size={36} className="text-primary/20" />
                </div>
              )}
              {/* Quick add overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
                  <ShoppingCart size={14} /> Add to Cart
                </button>
              </div>
            </div>

            <div className="p-3">
              {product.category && (
                <span className="text-[10px] text-text-muted uppercase tracking-wide">{product.category}</span>
              )}
              <h3 className="text-text-primary text-sm font-medium mt-0.5 line-clamp-2">{product.name}</h3>
              {product.description && (
                <p className="text-text-muted text-xs mt-1 line-clamp-1">{product.description}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-primary font-bold">{formatCurrency(product.price)}</span>
                <button className="p-1.5 rounded-lg bg-surface-variant hover:bg-primary/10 text-text-muted hover:text-primary transition-colors">
                  <ShoppingCart size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
