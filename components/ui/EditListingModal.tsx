'use client'

import React, { useState } from 'react'
import { Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface EditListingModalProps {
  listing: {
    id: string
    title: string
    description: string | null
    price: number
    category: string | null
    condition: string | null
    location: string | null
    status: string
  }
  onSuccess: () => void
  onClose: () => void
}

export function EditListingModal({ listing, onSuccess, onClose }: EditListingModalProps) {
  const supabase = createClient()
  const [title, setTitle] = useState(listing.title)
  const [description, setDescription] = useState(listing.description ?? '')
  const [price, setPrice] = useState(listing.price.toString())
  const [category, setCategory] = useState(listing.category ?? 'Engine')
  const [condition, setCondition] = useState(listing.condition ?? 'New')
  const [location, setLocation] = useState(listing.location ?? '')
  const [status, setStatus] = useState(listing.status)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !price || !location) {
      toast.error('Missing fields')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({
          title,
          description,
          price: parseFloat(price),
          category,
          condition,
          location,
          status,
        })
        .eq('id', listing.id)

      if (error) throw error

      toast.success('Listing Updated Successfully!')
      onSuccess()
    } catch (err: any) {
      toast.error('Failed to update listing', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-surface border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-background">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>
              Edit Parts Listing
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-variant text-text-muted transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Item Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input bg-background border-slate-800 focus:border-primary/50 text-white w-full h-10 px-3 rounded-lg"
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
                className="input bg-background border-slate-800 focus:border-primary/50 text-white w-full h-10 px-3 rounded-lg font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Location *</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input bg-background border-slate-800 focus:border-primary/50 text-white w-full h-10 px-3 rounded-lg"
                style={{ fontFamily: 'var(--font-inter), sans-serif' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input bg-background border-slate-800 focus:border-primary/50 text-white w-full h-10 px-3 rounded-lg"
                style={{ fontFamily: 'var(--font-inter), sans-serif' }}
              >
                <option value="Engine">Engine Components</option>
                <option value="Suspension">Suspension & Handling</option>
                <option value="Brakes">Braking Systems</option>
                <option value="Wheels">Wheels & Tyres</option>
                <option value="Exterior">Exterior Aero & Body</option>
                <option value="Interior">Interior Cabin Accessories</option>
                <option value="Electronics">Electrical & Tuning Kits</option>
                <option value="Others">Others / Misc</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="input bg-background border-slate-800 focus:border-primary/50 text-white w-full h-10 px-3 rounded-lg"
                style={{ fontFamily: 'var(--font-inter), sans-serif' }}
              >
                <option value="New">Brand New (Pristine)</option>
                <option value="Like New">Used — Like New</option>
                <option value="Good">Used — Good Condition</option>
                <option value="Fair">Used — Has Fair Marks</option>
                <option value="Refurbished">Remanufactured / Rebuilt</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Listing Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input bg-background border-slate-800 focus:border-primary/50 text-white w-full h-10 px-3 rounded-lg uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: '10px', fontWeight: 'bold' }}
            >
              <option value="active">Active (Items for Sale)</option>
              <option value="sold">Sold (Close Deal)</option>
              <option value="inactive">Inactive (Hide Product)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Item Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input bg-background border-slate-800 focus:border-primary/50 text-white w-full p-3 rounded-lg resize-none leading-relaxed"
              style={{ fontFamily: 'var(--font-inter), sans-serif' }}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary text-black font-bold uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-1.5"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent animate-spin rounded-full" />
              ) : (
                <>
                  <Check size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
