import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { ShopClient } from '@/components/shop/ShopClient'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Shop official Revoluzion automotive accessories and performance parts',
}

export const revalidate = 300

export default async function ShopPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('products')
    .select(
      'id, name, slug, sku_public, price_retail, stock_qty, is_featured, meta_description, description, categories(name), product_images(url, sort_order)',
    )
    .eq('is_published', true)
    .eq('is_deleted', false)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(500)

  const products = (data ?? []).map((p) => {
    const imgs = (
      (p.product_images ?? []) as { url: string; sort_order: number }[]
    ).sort((a, b) => a.sort_order - b.sort_order)
    return {
      id: p.id,
      name: p.name,
      slug: p.slug ?? p.id,
      sku: p.sku_public ?? '',
      priceRetail: p.price_retail,
      stockQty: p.stock_qty,
      isFeatured: p.is_featured ?? false,
      shortDescription: p.meta_description ?? p.description ?? null,
      categoryName: (p.categories as unknown as { name: string } | null)?.name ?? null,
      imageUrl: imgs[0]?.url ?? null,
    }
  })

  return <ShopClient products={products} />
}