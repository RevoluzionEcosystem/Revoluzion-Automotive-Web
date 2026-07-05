'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, MapPin, Phone, Trash, UploadCloud, Loader2, X } from 'lucide-react'
import Image from 'next/image'

interface FormItem {
  id: string
  title: string
  price: string
  oem_part_number: string
  description: string
  images: (string | null)[]
  uploading: boolean
}

export default function PostHalfcutPage() {
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // General fields (Top of form page)
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [contact, setContact] = useState('')
  const [status, setStatus] = useState('active') // Default published, can be 'draft'

  // Sub parts list (Users can register multiple parts under this halfcut)
  const [items, setItems] = useState<FormItem[]>([
    {
      id: 'initial-part-id',
      title: '',
      price: '',
      oem_part_number: '',
      description: '',
      images: [null, null, null, null, null],
      uploading: false,
    }
  ])

  // State to track drag highlights and ghost scales
  const [draggedPos, setDraggedImgPos] = useState<{ itemIdx: number; imgIdx: number } | null>(null)
  const [dragOverPos, setDragOverImgPos] = useState<{ itemIdx: number; imgIdx: number } | null>(null)

  function handleAddItem() {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
        title: '',
        price: '',
        oem_part_number: '',
        description: '',
        images: [null, null, null, null, null],
        uploading: false,
      }
    ])
  }

  function handleRemoveItem(idx: number) {
    if (items.length <= 1) {
      toast.error('At least one item must be included')
      return
    }
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: keyof FormItem, val: any) {
    setItems((prev) => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: val } as FormItem
      return copy
    })
  }

  const handleUploadImages = async (itemIdx: number, files: FileList | null) => {
    if (!files || files.length === 0) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to upload images')
      return
    }

    const currentImages = [...items[itemIdx].images]
    const emptySlotIndexes = currentImages
      .map((img, idx) => (img === null ? idx : -1))
      .filter((idx) => idx !== -1)

    if (emptySlotIndexes.length === 0) {
      toast.error('This part already has 5 images')
      return
    }

    const filesToUpload = Array.from(files).slice(0, emptySlotIndexes.length)
    if (files.length > emptySlotIndexes.length) {
      toast.warning(`Only uploading first ${emptySlotIndexes.length} files to fit 5 slots limit.`)
    }

    updateItem(itemIdx, 'uploading', true)
    const toastId = toast.loading(`Uploading ${filesToUpload.length} image(s)...`)

    try {
      const newUrls: string[] = []
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i]
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `halfcuts/${user.id}/${Date.now()}_part_${itemIdx}_${i}_${Math.random().toString(36).substring(2, 7)}.${ext}`

        const { error: uploadErr } = await supabase.storage
          .from('user-content')
          .upload(path, file, { cacheControl: '31536000', upsert: true })

        if (uploadErr) throw uploadErr

        const { data: { publicUrl } } = supabase.storage
          .from('user-content')
          .getPublicUrl(path)

        if (publicUrl) {
          newUrls.push(publicUrl)
        }
      }

      setItems((prev) => {
        const copy = [...prev]
        const rowImages = [...copy[itemIdx].images]
        
        let urlIdx = 0
        for (let sIdx = 0; sIdx < 5; sIdx++) {
          if (rowImages[sIdx] === null && urlIdx < newUrls.length) {
            rowImages[sIdx] = newUrls[urlIdx]
            urlIdx++
          }
        }

        copy[itemIdx] = { ...copy[itemIdx], images: rowImages, uploading: false }
        return copy
      })

      toast.success('Images uploaded successfully!', { id: toastId })
    } catch (err: any) {
      toast.error(`Image upload failed: ${err.message}`, { id: toastId })
      updateItem(itemIdx, 'uploading', false)
    }
  }

  const handleUploadToSpecificSlot = async (itemIdx: number, imgIdx: number, file: File) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to upload images')
      return
    }

    updateItem(itemIdx, 'uploading', true)
    const toastId = toast.loading('Uploading image to selected slot...')

    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `halfcuts/${user.id}/${Date.now()}_part_${itemIdx}_slot_${imgIdx}_${Math.random().toString(36).substring(2, 7)}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('user-content')
        .upload(path, file, { cacheControl: '31536000', upsert: true })

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from('user-content')
        .getPublicUrl(path)

      if (!publicUrl) throw new Error('Could not resolve public URL')

      setItems((prev) => {
        const copy = [...prev]
        const rowImages = [...copy[itemIdx].images]
        rowImages[imgIdx] = publicUrl
        copy[itemIdx] = { ...copy[itemIdx], images: rowImages, uploading: false }
        return copy
      })

      toast.success('Image saved directly into target slot!', { id: toastId })
    } catch (err: any) {
      toast.error(`Image upload failed: ${err.message}`, { id: toastId })
      updateItem(itemIdx, 'uploading', false)
    }
  }

  const handleUploadMultipleFromSlot = async (itemIdx: number, startImgIdx: number, files: FileList) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to upload images')
      return
    }

    // Determine how many empty slots can be filled starting from the clicked slot
    const rowImages = [...items[itemIdx].images]
    const slotsToFill: number[] = []
    
    // Find empty spots from the starting index forward, then any remaining empty spots
    for (let i = startImgIdx; i < 5; i++) {
      if (rowImages[i] === null) slotsToFill.push(i)
    }
    for (let i = 0; i < startImgIdx; i++) {
      if (rowImages[i] === null) slotsToFill.push(i)
    }

    if (slotsToFill.length === 0) {
      toast.error('All image slots are currently full!')
      return
    }

    const filesToUpload = Array.from(files).slice(0, slotsToFill.length)
    updateItem(itemIdx, 'uploading', true)
    const toastId = toast.loading(`Uploading ${filesToUpload.length} image(s)...`)

    try {
      const uploadedUrls: string[] = []
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i]
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `halfcuts/${user.id}/${Date.now()}_part_${itemIdx}_slot_${slotsToFill[i]}_${Math.random().toString(36).substring(2, 7)}.${ext}`

        const { error: uploadErr } = await supabase.storage
          .from('user-content')
          .upload(path, file, { cacheControl: '31536000', upsert: true })

        if (uploadErr) throw uploadErr

        const { data: { publicUrl } } = supabase.storage
          .from('user-content')
          .getPublicUrl(path)

        if (publicUrl) {
          uploadedUrls.push(publicUrl)
        }
      }

      setItems((prev) => {
        const copy = [...prev]
        const currentImages = [...copy[itemIdx].images]
        for (let i = 0; i < uploadedUrls.length; i++) {
          const targetSlot = slotsToFill[i]
          currentImages[targetSlot] = uploadedUrls[i]
        }
        copy[itemIdx] = { ...copy[itemIdx], images: currentImages, uploading: false }
        return copy
      })

      toast.success('Images uploaded to available slots!', { id: toastId })
    } catch (err: any) {
      toast.error(`Batch upload failed: ${err.message}`, { id: toastId })
      updateItem(itemIdx, 'uploading', false)
    }
  }

  const handleRemoveImage = (itemIdx: number, imgIdx: number) => {
    setItems((prev) => {
      const copy = [...prev]
      const rowImages = [...copy[itemIdx].images]
      rowImages[imgIdx] = null
      copy[itemIdx] = { ...copy[itemIdx], images: rowImages }
      return copy
    })
  }

  const handleDragStart = (e: React.DragEvent, itemIdx: number, imgIdx: number) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ itemIdx, imgIdx }))
    setDraggedImgPos({ itemIdx, imgIdx })
  }

  const handleDragOver = (e: React.DragEvent, itemIdx: number, imgIdx: number) => {
    e.preventDefault()
    setDragOverImgPos({ itemIdx, imgIdx })
  }

  const handleDrop = (e: React.DragEvent, targetItemIdx: number, targetImgIdx: number) => {
    e.preventDefault()
    setDraggedImgPos(null)
    setDragOverImgPos(null)
    try {
      const dataStr = e.dataTransfer.getData('text/plain')
      if (!dataStr) return
      const data = JSON.parse(dataStr)
      const { itemIdx: sourceItemIdx, imgIdx: sourceImgIdx } = data

      if (sourceItemIdx !== targetItemIdx) return

      setItems((prev) => {
        const copy = [...prev]
        const rowImages = [...copy[targetItemIdx].images]
        
        const temp = rowImages[sourceImgIdx]
        rowImages[sourceImgIdx] = rowImages[targetImgIdx]
        rowImages[targetImgIdx] = temp

        copy[targetItemIdx] = { ...copy[targetItemIdx], images: rowImages }
        return copy
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleDragEnd = () => {
    setDraggedImgPos(null)
    setDragOverImgPos(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please sign in to register halfcuts'); return }

    if (!title.trim()) { toast.error('Halfcut directory title is required'); return }

    // Validate entries
    for (const item of items) {
      if (!item.title.trim()) {
        toast.error('All listing parts require a valid title')
        return
      }
      if (!item.price || isNaN(parseFloat(item.price)) || parseFloat(item.price) < 0) {
        toast.error('All listing parts require a valid positive price')
        return
      }
    }

    setSaving(true)

    // 1. Post core halfcut header
    const { data: halfcutData, error: halfcutErr } = await supabase
      .from('halfcuts')
      .insert({
        user_id: user.id,
        title: title.trim(),
        location: location.trim() || null,
        contact: contact.trim() || null,
        status: status,
      })
      .select('id')
      .single()

    if (halfcutErr || !halfcutData) {
      toast.error('Failed to post halfcut header line', { description: halfcutErr?.message })
      setSaving(false)
      return
    }

    // 2. Insert rows inside child items set
    const childRecords = items.map((item) => {
      const activeUrls = item.images.filter((url): url is string => url !== null)
      return {
        halfcut_id: halfcutData.id,
        title: item.title.trim(),
        price: parseFloat(item.price),
        oem_part_number: item.oem_part_number.trim() || null,
        description: item.description.trim() || null,
        images_gallery: activeUrls,
      }
    })

    const { error: itemsErr } = await supabase
      .from('halfcut_items')
      .insert(childRecords)

    if (itemsErr) {
      toast.error('Failed to post sub-items list', { description: itemsErr.message })
    } else {
      toast.success('Halfcut Parts Sheet Posted!', { description: `"${title}" has been registered.` })
      router.push('/halfcuts')
      router.refresh()
    }

    setSaving(false)
  }

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2.5xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>
            Post a Halfcut Bundle Set
          </h1>
          <p className="text-text-muted text-xs">Register donor spares, multi-component engines or car strips comprehensively</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-transparent">
        {/* Core Sheet Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-widest text-text-secondary mb-2">
              Halfcut Title *
            </label>
            <input
              className="input text-sm bg-surface border border-slate-800 focus:border-primary/50 text-white rounded-xl h-12"
              placeholder="e.g. BMW F02 740Li Halfcut Parts (Full Car stripping)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-text-secondary mb-2">
              Publish State
            </label>
            <select
              className={`input text-sm uppercase font-extrabold tracking-wide text-xs bg-surface border border-slate-800 focus:border-primary/50 rounded-xl h-12 ${
                status === 'active' ? 'text-emerald-400' : status === 'draft' ? 'text-slate-400' : 'text-yellow-400'
              }`}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active" className="text-emerald-400 bg-background">Active (Publish Live)</option>
              <option value="draft" className="text-slate-400 bg-background">Draft (Save privately)</option>
              <option value="inactive" className="text-yellow-400 bg-background">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-text-secondary mb-2 flex items-center gap-1.5">
              <MapPin size={13} className="text-primary" /> Location
            </label>
            <input
              className="input text-sm bg-surface border border-slate-800 focus:border-primary/50 text-white rounded-xl h-12"
              placeholder="e.g. Klang, Selangor"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-widest text-text-secondary mb-2 flex items-center gap-1.5">
              <Phone size={13} className="text-teal-400" /> Contact Number (Optional Phone fallback)
            </label>
            <input
              className="input text-sm bg-surface border border-slate-800 focus:border-primary/50 text-white rounded-xl h-12"
              placeholder="e.g. +60123456789"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic Child items rows list */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="font-bold text-sm tracking-wider text-white uppercase" style={{ fontFamily: 'var(--font-orbitron)' }}>
              List of Strips / Parts included in listing
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 hover:border-primary/50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Part Row
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {items.map((item, idx) => (
              <div 
                key={item.id} 
                className="p-6 rounded-2xl space-y-5 relative group/row transition-all bg-gradient border border-slate-800/80 shadow-xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1.5">
                      Component / Part Title *
                    </label>
                    <input
                      value={item.title}
                      onChange={(e) => updateItem(idx, 'title', e.target.value)}
                      placeholder="e.g. N55 Twin Scroll Turbo assembly"
                      className="input text-sm bg-black border border-slate-800 focus:border-primary/50 text-white rounded-xl h-11"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1.5">
                      OEM Part Number (Optional)
                    </label>
                    <input
                      value={item.oem_part_number}
                      onChange={(e) => updateItem(idx, 'oem_part_number', e.target.value)}
                      placeholder="e.g. 11657636424"
                      className="input text-sm bg-black border border-slate-800 focus:border-primary/50 text-white rounded-xl h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1.5">
                      Price Tag (RM) *
                    </label>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => updateItem(idx, 'price', e.target.value)}
                      placeholder="e.g. 2400"
                      className="input text-sm bg-black border border-slate-800 focus:border-primary/50 text-white rounded-xl h-11"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1.5">
                    Description / Condition fitment notes
                  </label>
                  <textarea
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    placeholder="e.g. Shaft play checked zero, excellent turbine housings, original item removed from running donor F02."
                    rows={2}
                    className="input text-sm resize-none bg-black border border-slate-800 focus:border-primary/50 text-white rounded-xl p-3"
                  />
                </div>

                {/* DRAGGABLE & MULTI-UPLOAD IMAGE ROW BOXES */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-white text-xs font-bold uppercase tracking-wider">Donor Part Images (Maximum 5)</h4>
                      <p className="text-[10px] text-text-muted">
                        First non-empty slot is the cover image. Draggable: hover over an image, click and drag to reorder.
                      </p>
                    </div>

                    <label className={`relative flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white rounded-xl text-xs font-semibold cursor-pointer text-text-muted transition-colors ${item.uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      <UploadCloud size={14} className="text-primary" />
                      <span>Upload to Slots</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleUploadImages(idx, e.target.files)}
                        disabled={item.uploading}
                      />
                    </label>
                  </div>

                  <div className="flex gap-3.5 flex-wrap">
                    {item.images.map((imgUrl, imgIdx) => {
                      const inputId = `file-input-${idx}-${imgIdx}`
                      const isDragged = draggedPos?.itemIdx === idx && draggedPos?.imgIdx === imgIdx
                      const isDragOver = dragOverPos?.itemIdx === idx && dragOverPos?.imgIdx === imgIdx
                      return (
                        <div
                          key={imgIdx}
                          draggable={imgUrl !== null}
                          onDragStart={(e) => handleDragStart(e, idx, imgIdx)}
                          onDragOver={(e) => handleDragOver(e, idx, imgIdx)}
                          onDragEnd={handleDragEnd}
                          onDrop={(e) => handleDrop(e, idx, imgIdx)}
                          onClick={() => {
                            if (imgUrl === null && !item.uploading) {
                              document.getElementById(inputId)?.click()
                            }
                          }}
                          style={{ width: '100px', height: '100px' }}
                          className={`relative border-2 rounded-xl flex flex-col items-center justify-center overflow-hidden transition-all duration-200 shrink-0 select-none ${
                            imgUrl !== null
                              ? 'border-slate-800 bg-background cursor-grab active:cursor-grabbing hover:border-primary/50'
                              : 'border-dashed border-slate-800 bg-black/10 hover:border-primary/40 hover:bg-primary/5 cursor-pointer text-text-muted hover:text-white'
                          } ${isDragged ? 'opacity-30 scale-90 rotate-2 border-primary border-dashed' : ''} ${isDragOver ? 'scale-105 border-primary shadow-lg shadow-primary/25 z-10' : ''}`}
                        >
                          {imgUrl === null && (
                            <input
                              id={inputId}
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  if (e.target.files.length === 1) {
                                    handleUploadToSpecificSlot(idx, imgIdx, e.target.files[0])
                                  } else {
                                    // Multiple files chosen! Fill from this slot forward into empty slots
                                    handleUploadMultipleFromSlot(idx, imgIdx, e.target.files)
                                  }
                                }
                              }}
                              disabled={item.uploading}
                            />
                          )}

                          {imgUrl !== null ? (
                            <>
                              <Image
                                src={imgUrl}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 20vw, 150px"
                              />
                              {/* Position badges */}
                              <span className="absolute top-1.5 left-1.5 bg-black/85 text-[8px] font-black text-white px-1.5 py-0.5 rounded tracking-widest border border-white/5 uppercase select-none">
                                {imgIdx === 0 ? 'COVER' : `SLOT ${imgIdx + 1}`}
                              </span>
                              
                              {/* Remove button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveImage(idx, imgIdx)
                                }}
                                className="absolute top-1.5 right-1.5 p-1 bg-black/80 hover:bg-rose-900/90 text-text-muted hover:text-rose-400 rounded-lg border border-white/5 transition-colors cursor-pointer"
                              >
                                <X size={10} />
                              </button>
                            </>
                          ) : (
                            <div className="text-center p-1 select-none pointer-events-none">
                              <span className="block text-[8px] font-black tracking-widest text-[#2A313C] uppercase mb-0.5 group-hover:text-primary">
                                {imgIdx === 0 ? 'MAIN COVER' : `SLOT ${imgIdx + 1}`}
                              </span>
                              <span className="block text-[7px] text-text-disabled/20 uppercase">EMPTY</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="w-full sm:w-auto px-4 py-2 text-rose-400 hover:text-rose-300 border border-rose-500/10 hover:border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl text-xs uppercase font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Trash size={13} /> Remove Part
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-6 border-t border-white/5 justify-end">
          <button
            type="button"
            onClick={() => router.push('/halfcuts')}
            className="px-6 py-3 bg-transparent border border-slate-800 hover:bg-slate-900/50 text-text-muted hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-8 py-3 rounded-xl font-bold uppercase tracking-widest cursor-pointer text-xs"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            {saving ? 'Registering...' : 'Register Halfcut parts'}
          </button>
        </div>
      </form>
    </div>
  )
}