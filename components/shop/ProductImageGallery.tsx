'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Package, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react'
import { ImageZoomModal } from './ImageZoomModal'

interface ImgItem { url: string; alt_text?: string | null }

export function ProductImageGallery({ images, productName }: { images: ImgItem[]; productName: string }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)

  const mainImg = images[activeIdx]?.url ?? null
  const zoomImgs = images.map((img) => ({ url: img.url, alt: img.alt_text ?? productName }))
  const total = images.length

  function prev() { setActiveIdx((i) => (i - 1 + total) % total) }
  function next() { setActiveIdx((i) => (i + 1) % total) }

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div className="aspect-square bg-surface-variant rounded-2xl overflow-hidden border border-border relative group">
          {mainImg ? (
            <>
              <Image
                src={mainImg}
                alt={images[activeIdx]?.alt_text ?? productName}
                fill
                className="object-cover cursor-zoom-in"
                priority
                sizes="(max-width:1024px)100vw,50vw"
                onClick={() => setModalOpen(true)}
              />
              {/* Zoom hint */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors pointer-events-none flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-2.5 pointer-events-none">
                  <ZoomIn size={18} className="text-white" />
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package size={64} className="text-primary/30" />
            </div>
          )}

          {/* Left / Right arrows — only show when multiple images */}
          {total > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/75 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/75 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <ChevronRight size={18} />
              </button>
              {/* Dot indicator */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setActiveIdx(i) }}
                    className={`rounded-full transition-all ${i === activeIdx ? 'w-4 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail strip — shown only when 2+ images */}
        {total > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === activeIdx ? 'border-primary' : 'border-border hover:border-primary/40'
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt_text ?? `${productName} ${i + 1}`}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <ImageZoomModal
        images={zoomImgs}
        startIndex={activeIdx}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
