'use client'

import React, { useState } from 'react'
import { Plus, X, Tag, UploadCloud, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface CreateListingModalProps {
  onSuccess: () => void
  onClose: () => void
}

export function CreateListingModal({ onSuccess, onClose }: CreateListingModalProps) {
  const supabase = createClient()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('Engine')
  const [condition, setCondition] = useState('New')
  const [location, setLocation] = useState('')
  
  // Real database binary file uploads (up to 10 files max)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (imageFiles.length + files.length > 10) {
      toast.error('Limit exceeded 🚫', { description: 'You can upload a maximum of 10 images.' })
      return
    }

    const nextFiles = [...imageFiles, ...files]
    setImageFiles(nextFiles)

    const urls = files.map(file => URL.createObjectURL(file))
    setImagePreviews(prev => [...prev, ...urls])
  }

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index])
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !price || !location) {
      toast.error('Missing fields', { description: 'Please fill in Title, Price and Location.' })
      return
    }

    setLoading(true)
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Session expired')
        return
      }

      // 1. Upload files to supabase storage ('user-content' bucket, 'marketplace' folder)
      const uploadedUrls: string[] = []
      if (imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i]
          const ext = file.name.split('.').pop() || 'jpg'
          const storagePath = `marketplace/${user.id}/${Date.now()}_listing_${i}.${ext}`

          const { error: uploadError } = await supabase.storage
            .from('user-content')
            .upload(storagePath, file, { cacheControl: '31536000', upsert: true })

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('user-content')
            .getPublicUrl(storagePath)

          if (publicUrl) {
            uploadedUrls.push(publicUrl)
          }
        }
      }

      // 2. Create marketplace listing row
      const { data: newListing, error: listingError } = await supabase
        .from('marketplace_listings')
        .insert({
          user_id: user.id,
          title,
          description,
          price: parseFloat(price),
          category,
          condition,
          location,
          status: 'active',
          listing_type: 'p2p'
        })
        .select()
        .single()

      if (listingError || !newListing) {
        throw new Error(listingError?.message || 'Failed listing creation')
      }

      // 3. Insert listings images relational list
      if (uploadedUrls.length > 0) {
        const imageRows = uploadedUrls.map((url, index) => ({
          listing_id: newListing.id,
          image_url: url,
          sort_order: index
        }))

        const { error: imageErr } = await supabase
          .from('marketplace_images')
          .insert(imageRows)

        if (imageErr) console.error('Images attach error:', imageErr)
      }

      toast.success('Listing Published! 🎉', {
        description: 'Your part matches have been published onto the local marketplace securely.'
      })
      
      // Clean up object URLs references
      imagePreviews.forEach(url => URL.revokeObjectURL(url))
      onSuccess()
    } catch (err: any) {
      toast.error('Failed to create listing', { description: err.message })
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-surface border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-background">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-primary animate-pulse" />
            <h3 className="font-bold text-white text-sm uppercase tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>
              Create New Listing
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-variant text-text-muted transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-[11px]">
          <div className="space-y-1">
            <label className="text-[9px] text-text-muted font-black uppercase tracking-wider">Item Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cusco Front Strut Tower Bar"
              className="input bg-background border-slate-800 focus:border-primary/50 text-white w-full h-9 px-3 rounded-lg text-xs"
              style={{ fontFamily: 'var(--font-inter), sans-serif' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] text-text-muted font-black uppercase tracking-wider">Price (RM) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="input bg-background border-slate-800 focus:border-primary/50 text-white w-full h-9 px-3 rounded-lg text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-text-muted font-black uppercase tracking-wider">Location *</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bangi, Selangor"
                className="input bg-background border-slate-800 focus:border-primary/50 text-white w-full h-9 px-3 rounded-lg text-xs"
                style={{ fontFamily: 'var(--font-inter), sans-serif' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] text-text-muted font-black uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input bg-background border-slate-800 focus:border-primary/50 text-white w-full h-9 px-3 rounded-lg text-xs"
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
              <label className="text-[9px] text-text-muted font-black uppercase tracking-wider">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="input bg-background border-slate-800 focus:border-primary/50 text-white w-full h-9 px-3 rounded-lg text-xs"
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

          <div className="space-y-2 border-t border-slate-800/60 pt-3">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[9px] text-text-muted font-black uppercase tracking-wider block">Listing Photographs ({imageFiles.length}/10 max)</label>
            </div>
            
            {/* Real File Input Drag & Drop or trigger button */}
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-slate-800 rounded-xl bg-slate-900/10 hover:bg-slate-900/20 hover:border-primary/40 cursor-pointer transition-all">
                <div className="flex flex-col items-center justify-center pt-2 pb-2">
                  <UploadCloud size={20} className="text-text-muted mb-1" />
                  <p className="text-[10px] text-text-muted font-medium">Click to select files (PNG, JPG, WEBP)</p>
                  <p className="text-[9px] text-text-disabled uppercase font-black">Up to 10 images max</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={imageFiles.length >= 10}
                />
              </label>
            </div>

            {/* Thumbnail previews of chosen images */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-2">
                {imagePreviews.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg border border-slate-800 overflow-hidden bg-slate-950 group">
                    <img src={url} alt="" className="object-cover w-full h-full" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 p-0.5 bg-black/75 rounded text-rose-500 hover:text-white transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[9px] text-text-muted font-black uppercase tracking-wider">Item Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell buyers about thread, wear, duration, and general fit details..."
              className="input bg-background border-slate-800 focus:border-primary/50 text-white w-full p-2.5 rounded-lg text-xs resize-none leading-relaxed"
              style={{ fontFamily: 'var(--font-inter), sans-serif' }}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full h-11 bg-primary text-black font-bold uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-1.5"
            >
              {(loading || uploading) ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> Saving & Uploading ({imageFiles.length} item{imageFiles.length > 1 ? 's' : ''})...
                </>
              ) : (
                <>
                  <Plus size={14} /> Publish Listing
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
