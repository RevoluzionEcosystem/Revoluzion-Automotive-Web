'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageItem { url: string; alt?: string }

interface Props {
  images: ImageItem[]
  startIndex?: number
  open: boolean
  onClose: () => void
}

export function ImageZoomModal({ images, startIndex = 0, open, onClose }: Props) {
  const [idx, setIdx] = useState(startIndex)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

  useEffect(() => { setIdx(startIndex); setZoom(1); setPan({ x: 0, y: 0 }) }, [startIndex, open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(4, z + 0.5))
      if (e.key === '-') setZoom((z) => Math.max(1, z - 0.5))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, idx]) // eslint-disable-line

  const prev = useCallback(() => { setIdx((i) => (i - 1 + images.length) % images.length); setZoom(1); setPan({ x: 0, y: 0 }) }, [images.length])
  const next = useCallback(() => { setIdx((i) => (i + 1) % images.length); setZoom(1); setPan({ x: 0, y: 0 }) }, [images.length])

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    setZoom((z) => Math.min(4, Math.max(1, z - e.deltaY * 0.002)))
  }

  function onMouseDown(e: React.MouseEvent) {
    if (zoom <= 1) return
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging || !dragStart.current) return
    setPan({ x: dragStart.current.px + (e.clientX - dragStart.current.x), y: dragStart.current.py + (e.clientY - dragStart.current.y) })
  }

  function onMouseUp() { setDragging(false); dragStart.current = null }

  if (!open || images.length === 0) return null

  const img = images[idx]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

      {/* Panel — square, sized to fit the viewport height */}
      <div
        className="relative z-10 flex flex-col bg-black rounded-2xl overflow-hidden shadow-2xl"
        style={{ width: 'min(90vw, 90vh)', height: 'min(90vw, 90vh)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 shrink-0 bg-black/80">
          <span className="text-white/60 text-sm">{idx + 1} / {images.length}</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => { setZoom((z) => Math.max(1, z - 0.5)); if (zoom <= 1.5) setPan({ x: 0, y: 0 }) }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors" disabled={zoom <= 1}>
              <ZoomOut size={14} />
            </button>
            <span className="text-white/50 text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors" disabled={zoom >= 4}>
              <ZoomIn size={14} />
            </button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors">
              Reset
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors ml-1">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Main image */}
        <div
          className={`flex-1 overflow-hidden flex items-center justify-center relative ${zoom > 1 ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'}`}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onClick={() => { if (zoom === 1) setZoom(2) }}
        >
          <div
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transition: dragging ? 'none' : 'transform 0.15s ease',
              width: '100%',
              height: '100%',
              position: 'relative',
            }}
          >
            <Image src={img.url} alt={img.alt ?? ''} fill className="object-contain select-none" draggable={false} priority />
          </div>

          {/* Navigation arrows — inside the panel */}
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors z-10">
                <ChevronLeft size={18} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors z-10">
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-2 px-3 border-t border-white/10 shrink-0 overflow-x-auto bg-black/80">
            {images.map((im, i) => (
              <button key={i} onClick={() => { setIdx(i); setZoom(1); setPan({ x: 0, y: 0 }) }}
                className={`w-10 h-10 rounded-lg overflow-hidden border-2 shrink-0 transition-colors ${i === idx ? 'border-primary' : 'border-white/20 hover:border-white/50'}`}>
                <Image src={im.url} alt="" width={40} height={40} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}