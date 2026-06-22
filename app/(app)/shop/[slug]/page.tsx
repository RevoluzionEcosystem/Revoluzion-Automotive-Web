import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Package, Shield, Truck, Wrench, Motorbike, BadgeCheck, Infinity, PlayCircle } from 'lucide-react'
import { ProductImageGallery } from '@/components/shop/ProductImageGallery'
import { formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'
import { ProductActions } from '@/components/shop/ProductActions'

export const revalidate = 0

interface Props {
  params: Promise<{ slug: string }>
}

async function fetchProduct(slug: string) {
  const supabase = await createClient()
  const { data: bySlug } = await supabase
    .from('products')
    .select('*, categories(name), brands(name), product_images(url, sort_order, alt_text), product_specifications(spec_key, spec_value, sort_order), product_fitment(make, model, year_from, year_to, notes)')
    .eq('slug', slug)
    .eq('is_published', true)
    .eq('is_deleted', false)
    .maybeSingle()
  if (bySlug) return bySlug

  const { data: byId } = await supabase
    .from('products')
    .select('*, categories(name), brands(name), product_images(url, sort_order, alt_text), product_specifications(spec_key, spec_value, sort_order), product_fitment(make, model, year_from, year_to, notes)')
    .eq('id', slug)
    .eq('is_published', true)
    .eq('is_deleted', false)
    .maybeSingle()
  return byId
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await fetchProduct(slug)
  if (!product) return { title: 'Product Not Found' }
  return {
    title: product.name,
    description: product.meta_description ?? product.description ?? undefined,
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const product = await fetchProduct(slug)
  if (!product) notFound()

  // Detect dealer session for tiered pricing
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let priceDealer: number | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('shop_role')
      .eq('id', user.id)
      .single()
    if (profile?.shop_role === 'DEALER' && product.price_dealer_1) {
      priceDealer = product.price_dealer_1 as number
    }
  }

  const images = ((product.product_images as { url: string; sort_order: number; alt_text?: string }[] ?? []))
    .sort((a, b) => a.sort_order - b.sort_order)
  const specs = ((product.product_specifications as { spec_key: string; spec_value: string; sort_order: number }[] ?? []))
    .sort((a, b) => a.sort_order - b.sort_order)
  const fitment = (product.product_fitment as { make?: string; model?: string; year_from?: number; year_to?: number; notes?: string }[] ?? [])

  const mainImage = images[0]?.url ?? null
  const categoryName = (product.categories as { name: string } | null)?.name
  const brandName = (product.brands as { name: string } | null)?.name
  const outOfStock = product.stock_qty === 0

  function specLabel(key: string) {
    return key.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link href="/shop" className="inline-flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors text-sm mb-6">
        <ArrowLeft size={16} /> Back to Shop
      </Link>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* ── Image gallery ── */}
        <ProductImageGallery images={images} productName={product.name} />

        {/* ── Product info ── */}
        <div className="flex flex-col gap-5">
          {/* Meta line */}
          <div className="flex items-center gap-2 text-xs text-text-muted">
            {categoryName && <span>{categoryName}</span>}
            {categoryName && brandName && <span>·</span>}
            {brandName && <span>{brandName}</span>}
            {product.sku_public && <><span>·</span><span className="font-mono">{product.sku_public}</span></>}
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold gradient-text leading-snug" style={{ fontFamily: 'var(--font-orbitron)' }}>
            {product.name}
          </h1>

          {/* Short description */}
          {(product.meta_description ?? product.description) && (
            <p className="text-text-secondary text-sm leading-relaxed">{product.meta_description ?? product.description}</p>
          )}

          {/* Add to cart + wishlist — includes price, dealer badge, SKU/stock/weight */}
          <ProductActions
            productId={product.id}
            name={product.name}
            sku={product.sku_public ?? ''}
            imageUrl={mainImage}
            priceRetail={product.price_retail}
            priceDealer={priceDealer}
            stockQty={product.stock_qty}
            stockAlert={product.stock_alert ?? 5}
            weight={product.weight ?? null}
            dimensions={product.dimensions ?? null}
          />

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Truck, text: 'Free shipping ≥ RM200' },
              { icon: Shield, text: 'Authentic products' },
              { icon: Wrench, text: 'Engineered to Spec' },
              { icon: Motorbike, text: 'Dispatch via Grab/Lalamove' },
              { icon: Truck, text: 'Same-Day Dispatch' },
              { icon: Infinity, text: 'Revoluzion Lifetime Guarantee' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="bg-surface-variant rounded-xl p-3 text-center">
                <Icon size={16} className="text-primary mx-auto mb-1" />
                <p className="text-[10px] text-text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Full description ── */}
      {product.description && (
        <div className="mt-10 card p-6">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Description</h2>
          <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
        </div>
      )}

      {/* ── Specifications ── */}
      {specs.length > 0 && (
        <div className="mt-4 card p-6">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Specifications</h2>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
            {specs.map((s) => (
              <div key={s.spec_key} className="flex justify-between text-sm py-1.5 border-b border-border/50">
                <span className="text-text-muted">{specLabel(s.spec_key)}</span>
                <span className="text-text-primary font-medium text-right">{s.spec_value}</span>
              </div>
            ))}
            {product.weight && (
              <div className="flex justify-between text-sm py-1.5 border-b border-border/50">
                <span className="text-text-muted">Weight</span>
                <span className="text-text-primary font-medium">{product.weight} kg</span>
              </div>
            )}
            {product.dimensions && (
              <div className="flex justify-between text-sm py-1.5 border-b border-border/50">
                <span className="text-text-muted">Dimensions</span>
                <span className="text-text-primary font-medium text-right">{product.dimensions}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Fitment ── */}
      {fitment.length > 0 && (
        <div className="mt-4 card p-6">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Vehicle Compatibility</h2>
          <div className="space-y-2">
            {fitment.map((f, i) => {
              const years = f.year_from && f.year_to ? `${f.year_from}–${f.year_to}` : f.year_from?.toString() ?? 'All Years'
              const makeModel = [f.make, f.model].filter(Boolean).join(' ')
              return (
                <div key={i} className="flex items-center gap-3 text-sm py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-text-primary font-medium">{makeModel}</span>
                  <span className="text-text-muted">{years}</span>
                  {f.notes && <span className="text-text-muted text-xs">· {f.notes}</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── YouTube ── */}
      {product.youtube_url && (
        <div className="mt-4 card p-6">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
            <PlayCircle size={14} /> Product Video
          </h2>
          <div className="aspect-video rounded-xl overflow-hidden bg-surface-variant">
            <iframe
              src={`https://www.youtube.com/embed/${product.youtube_url.split('v=')[1]?.split('&')[0] ?? product.youtube_url}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`${product.name} video`}
            />
          </div>
        </div>
      )}
    </div>
  )
}
