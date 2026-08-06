'use client'

import React, { useState } from 'react'
import { X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface EditHalfcutItemModalProps {
  item: {
    id: string
    title: string
    price: number
    oem_part_number: string | null
    description: string | null
    status: string
  }
  onSuccess: () => void
  onClose: () => void
}

export function EditHalfcutItemModal({ item, onSuccess, onClose }: EditHalfcutItemModalProps) {
  const supabase = createClient()
  const [title, setTitle] = useState(item.title)
  const [price, setPrice] = useState(item.price.toString())
  const [oemPartNumber, setOemPartNumber] = useState(item.oem_part_number ?? '')
  const [description, setDescription] = useState(item.description ?? '')
  const [status, setStatus] = useState(item.status)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !price) {
      toast.error('Missing required fields')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('halfcut_items')
        .update({
          title,
          price: parseFloat(price),
          oem_part_number: oemPartNumber || null,
          description,
          status,
        })
        .eq('id', item.id)

      if (error) throw error

      toast.success('Halfcut component updated successfully!')
      onSuccess()
    } catch (err: any) {
      toast.error('Failed to update component: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-surface border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-background">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>
            Edit Halfcut Component
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-text-muted transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Component Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input bg-background border border-slate-800 focus:border-primary/50 text-white w-full h-10 px-3 rounded-lg outline-none"
              style={{ fontFamily: 'var(--font-inter), sans-serif' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Price (RM) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input bg-background border border-slate-800 focus:border-primary/50 text-white w-full h-10 px-3 rounded-lg font-mono outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">OEM Part Number</label>
              <input
                type="text"
                value={oemPartNumber}
                onChange={(e) => setOemPartNumber(e.target.value)}
                placeholder="e.g. 11002220120"
                className="input bg-background border border-slate-800 focus:border-primary/50 text-white w-full h-10 px-3 rounded-lg font-mono outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Inventory Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input bg-background border border-slate-800 focus:border-primary/50 text-white w-full h-10 px-3 rounded-lg outline-none font-bold text-xs"
              style={{ fontFamily: 'var(--font-inter), sans-serif' }}
            >
              <option value="available">Available (In Stock)</option>
              <option value="sold">Sold (Out of stock)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact details of the part condition, package fittings or compatibility..."
              className="input bg-background border border-slate-800 focus:border-primary/50 text-white w-full p-3 rounded-lg outline-none resize-none leading-relaxed"
              style={{ fontFamily: 'var(--font-inter), sans-serif' }}
            />
          </div>

          {/* Footer buttons inside body grid */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700/60 rounded-xl text-white font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 btn-primary flex items-center justify-center gap-1 text-[11px] font-bold tracking-wider rounded-xl cursor-pointer"
            >
              {loading ? 'Saving...' : 'Save Updates'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
