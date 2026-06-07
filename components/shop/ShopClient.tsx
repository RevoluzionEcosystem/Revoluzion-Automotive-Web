'use client'

import { useState, useMemo } from 'react'
import { Search, X, Package, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ShopProductCard } from './ShopProductCard'

type Product = {
  id: string; name: string; slug: string; sku: string; priceRetail: number
  stockQty: number; isFeatured: boolean; shortDescription: string | null
  categoryName: string | null; imageUrl: string | null
}

export function ShopClient({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sort, setSort] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default')
  const [mobileCatOpen, setMobileCatOpen] = useState(false)

  const categories = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of products) if (p.categoryName) map.set(p.categoryName, (map.get(p.categoryName) ?? 0) + 1)
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name))
  }, [products])

  const filtered = useMemo(() => {
    let r = products
    if (activeCategory !== 'All') r = r.filter((p) => p.categoryName === activeCategory)
    if (query.trim()) {
      // Split into tokens — all tokens must match somewhere in the product (order-independent)
      const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
      r = r.filter((p) => {
        // Build a single searchable string from all relevant fields
        const haystack = [
          p.name,
          p.sku,
          p.shortDescription ?? '',
          p.categoryName ?? '',
          String(p.priceRetail),
        ]
          .join(' ')
          .toLowerCase()
          // Normalise common separators so "AN-4", "AN 4", "AN4" all match
          .replace(/[-_/]/g, ' ')

        return tokens.every((token) => {
          // Also check the raw haystack (with separators) for hyphenated SKU patterns
          const raw = haystack.replace(/ /g, '')
          const tokenNorm = token.replace(/[-_/]/g, '')
          return haystack.includes(token) || raw.includes(tokenNorm)
        })
      })
    }
    // Sort: in-stock first, out-of-stock always last
    const inStock = r.filter((p) => p.stockQty > 0)
    const outOfStock = r.filter((p) => p.stockQty === 0)
    if (sort === 'price-asc') { inStock.sort((a, b) => a.priceRetail - b.priceRetail); outOfStock.sort((a, b) => a.priceRetail - b.priceRetail) }
    else if (sort === 'price-desc') { inStock.sort((a, b) => b.priceRetail - a.priceRetail); outOfStock.sort((a, b) => b.priceRetail - a.priceRetail) }
    else if (sort === 'name') { inStock.sort((a, b) => a.name.localeCompare(b.name)); outOfStock.sort((a, b) => a.name.localeCompare(b.name)) }
    else { /* default: featured first */ inStock.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)) }
    return [...inStock, ...outOfStock]
  }, [products, activeCategory, query, sort])

  const hasFilters = !!(query || activeCategory !== 'All' || sort !== 'default')
  const SH = 'calc(100vh - 64px)'

  return (
    <div className="flex">
      {/* ── Left: Category Sidebar (208px → 280px) ─── */}
      <aside className="w-72 shrink-0 border-r border-border hidden lg:flex flex-col sticky top-0" style={{ height: SH }}>
        <div className="px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>
            Categories
          </h2>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          <button
            onClick={() => setActiveCategory('All')}
            className={cn('w-full text-left flex items-center justify-between px-5 py-2.5 text-sm transition-colors',
              activeCategory === 'All' ? 'text-primary bg-primary/10 font-semibold' : 'text-text-secondary hover:bg-surface-variant hover:text-text-primary'
            )}
          >
            <span>All</span>
            <span className="text-xs text-text-muted tabular-nums">{products.length}</span>
          </button>
          {categories.map((cat) => (
            <button key={cat.name} onClick={() => setActiveCategory(cat.name)}
              className={cn('w-full text-left flex items-center justify-between px-5 py-2.5 text-sm transition-colors',
                activeCategory === cat.name ? 'text-primary bg-primary/10 font-semibold' : 'text-text-secondary hover:bg-surface-variant hover:text-text-primary'
              )}
            >
              <span className="truncate pr-2">{cat.name}</span>
              <span className="text-xs text-text-muted tabular-nums shrink-0">{cat.count}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Center ─── */}
      <div className="flex-1 min-w-0">
        {/* Sticky header */}
        <div className="sticky top-0 z-20 bg-background border-b border-border px-5 pt-4 pb-3 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg font-black uppercase gradient-text whitespace-nowrap" style={{ fontFamily: 'var(--font-orbitron)' }}>
              Revoluzion Automotive Store
            </h1>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, SKU, category, price…"
              className="w-full pl-10 pr-9 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
              autoComplete="off" spellCheck={false}
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-muted">{filtered.length} products</span>
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {/* Mobile category dropdown */}
              <div className="relative lg:hidden">
                <button onClick={() => setMobileCatOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-surface border border-border rounded-lg">
                  {activeCategory === 'All' ? 'All Categories' : activeCategory}
                  <ChevronDown size={11} className={cn('transition-transform', mobileCatOpen && 'rotate-180')} />
                </button>
                {mobileCatOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-background border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                    {['All', ...categories.map((c) => c.name)].map((cat) => (
                      <button key={cat} onClick={() => { setActiveCategory(cat); setMobileCatOpen(false) }}
                        className={cn('w-full text-left px-4 py-2 text-sm transition-colors hover:bg-surface-variant', activeCategory === cat ? 'text-primary font-medium' : 'text-text-secondary')}>
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Sort */}
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
                className="text-xs px-2.5 py-1.5 bg-surface border border-border rounded-lg focus:outline-none">
                <option value="default">Default</option>
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
                <option value="name">Name A–Z</option>
              </select>
              {hasFilters && (
                <button onClick={() => { setQuery(''); setActiveCategory('All'); setSort('default') }}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-0.5">
                  <X size={11} /> Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Package size={48} className="text-primary/20 mb-4" />
              <p className="text-text-secondary font-medium">No products found</p>
              {query && <p className="text-text-muted text-sm mt-1">No results for &ldquo;{query}&rdquo;</p>}
              <button onClick={() => { setQuery(''); setActiveCategory('All') }} className="mt-4 text-primary text-sm hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2.5">
              {filtered.map((product, idx) => (
                <ShopProductCard
                  key={product.id}
                  productId={product.id} name={product.name} slug={product.slug} sku={product.sku}
                  priceRetail={product.priceRetail} stockQty={product.stockQty} isFeatured={product.isFeatured}
                  shortDescription={product.shortDescription} categoryName={product.categoryName} imageUrl={product.imageUrl}
                  priority={idx < 7}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}