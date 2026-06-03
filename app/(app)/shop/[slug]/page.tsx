import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ShoppingCart, Star, Package, Shield, Truck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'

export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

// Demo fallback products (same as shop page)
const DEMO_PRODUCTS = [
  { id: '1', name: 'Revoluzion Classic Tee', price: 59.90, category: 'Apparel', image_url: null, description: 'Premium cotton tee with embroidered Revoluzion logo. Available in black and navy. 100% ring-spun cotton for ultimate comfort.', is_active: true, slug: '1' },
  { id: '2', name: 'Racing Cap — Cyan Edition', price: 49.90, category: 'Apparel', image_url: null, description: 'Snapback cap featuring a 3D Revoluzion embroidery on the front panel. One size fits most with adjustable strap.', is_active: true, slug: '2' },
  { id: '3', name: 'Revoluzion Hoodie', price: 119.90, category: 'Apparel', image_url: null, description: 'Heavyweight 400gsm cotton-polyester blend hoodie. Double-lined hood, kangaroo pocket, and ribbed cuffs. Perfect for cool nights at the track.', is_active: true, slug: '3' },
  { id: '4', name: 'Sticker Pack Vol.1', price: 19.90, category: 'Accessories', image_url: null, description: '10-piece premium vinyl sticker set. UV-resistant, weatherproof, and die-cut. Perfect for laptops, cars, and helmets.', is_active: true, slug: '4' },
  { id: '5', name: 'Phone Mount Pro', price: 89.90, category: 'Accessories', image_url: null, description: 'MagSafe-compatible magnetic dashboard mount. 360° rotation, strong adhesive base, fits all smartphones. Perfect for navigation while driving.', is_active: true, slug: '5' },
  { id: '6', name: 'Keyrings Set', price: 29.90, category: 'Accessories', image_url: null, description: 'Zinc alloy car keyring pair featuring the Revoluzion logo. Heavy-duty construction with smooth finish. Great as a gift.', is_active: true, slug: '6' },
]

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  
  let product: any = null
  try {
    const { data } = await supabase
      .from('products')
      .select('name, description')
      .or(`id.eq.${slug},slug.eq.${slug}`)
      .single()
    product = data
  } catch {
    product = DEMO_PRODUCTS.find((p) => p.id === slug || p.slug === slug) ?? null
  }

  if (!product) {
    return { title: 'Product Not Found' }
  }

  return {
    title: product.name,
    description: product.description,
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  let product: any = null
  try {
    const { data } = await supabase
      .from('products')
      .select('*, product_images(url, sort_order)')
      .or(`id.eq.${slug},slug.eq.${slug}`)
      .eq('is_active', true)
      .single()
    product = data
  } catch {
    product = DEMO_PRODUCTS.find((p) => p.id === slug || p.slug === slug) ?? null
  }

  if (!product) notFound()

  // Sort images if available
  const images: { url: string; sort_order: number }[] = (
    (product.product_images as { url: string; sort_order: number }[] | undefined) ?? []
  ).sort((a, b) => a.sort_order - b.sort_order)

  const mainImage = images[0]?.url ?? product.image_url ?? null
  const cartItem = {
    name: product.name,
    price: Math.round(product.price * 100), // cents for Stripe
    quantity: 1,
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors text-sm mb-6"
      >
        <ArrowLeft size={16} /> Back to Shop
      </Link>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Image gallery */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="aspect-square bg-surface-variant rounded-2xl overflow-hidden border border-border">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <Package size={64} className="text-primary/30" />
                <span className="text-text-muted text-sm">{product.category}</span>
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(1).map((img: { url: string; sort_order: number }, i: number) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border bg-surface-variant">
                  <Image src={img.url} alt={`${product.name} ${i + 2}`} width={150} height={150} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="flex flex-col gap-6">
          {/* Badge + title */}
          <div>
            {product.category && (
              <span className="badge badge-primary text-xs mb-2 inline-block">{product.category}</span>
            )}
            <h1 className="text-2xl font-bold text-text-primary mt-1">{product.name}</h1>

            {/* Rating placeholder */}
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={14} fill={star <= 4 ? '#06B6D4' : 'none'} className="text-primary" />
              ))}
              <span className="text-text-muted text-xs ml-1">4.0 · 12 reviews</span>
            </div>
          </div>

          {/* Price */}
          <div className="text-3xl font-bold text-primary">{formatCurrency(product.price)}</div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Description</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-3 text-center">
              <Truck size={20} className="text-primary mx-auto mb-1" />
              <p className="text-xs text-text-muted">Free delivery over RM100</p>
            </div>
            <div className="card p-3 text-center">
              <Shield size={20} className="text-primary mx-auto mb-1" />
              <p className="text-xs text-text-muted">Authentic products</p>
            </div>
            <div className="card p-3 text-center">
              <Package size={20} className="text-primary mx-auto mb-1" />
              <p className="text-xs text-text-muted">30-day returns</p>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Link
              href={`/shop/cart?add=${product.id}&name=${encodeURIComponent(product.name)}&price=${Math.round(product.price * 100)}`}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3"
            >
              <ShoppingCart size={20} />
              Add to Cart
            </Link>
            <Link
              href="/shop/cart"
              className="btn-secondary w-full flex items-center justify-center gap-2 text-base py-3"
            >
              View Cart
            </Link>
          </div>

          {/* Meta */}
          {product.sku && (
            <p className="text-xs text-text-muted">SKU: {product.sku}</p>
          )}
        </div>
      </div>
    </div>
  )
}
