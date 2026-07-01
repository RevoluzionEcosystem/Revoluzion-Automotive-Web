'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { 
  CalendarDays, X, Plus, Upload, Link2, ArrowRight,
  Car, Compass, Trophy, Store, ShieldAlert, BadgeInfo, MapPin 
} from 'lucide-react'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!

// Low-cost cache logic to avoid excessive API requests.
let loaderPromise: Promise<any> | null = null
function getMapsLoader() {
    if (typeof window === 'undefined') return Promise.reject()
    if (loaderPromise) return loaderPromise

    loaderPromise = (async () => {
        const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader')
        setOptions({
            key: GOOGLE_MAPS_API_KEY,
            v: 'weekly',
        })
        await Promise.all([
            importLibrary('maps'),
            importLibrary('marker')
        ])
        return (window as any).google.maps
    })()
    return loaderPromise
}

const EVENT_TYPES = [
  {
    id: 'Car Meet',
    title: 'Car Meet & Gathering',
    description: 'Casual car meet, night staging, coffee & cars, or staging runs. Quick, standard, and focused purely on social car culture.',
    icon: Car,
    color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
  },
  {
    id: 'Track Day',
    title: 'Track Day / Circuit',
    description: 'Time attacks, track sessions, open-pit runs, or organized professional circuit stages at Sepang etc.',
    icon: Compass,
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
  },
  {
    id: 'Race',
    title: 'Motorsport Race',
    description: 'Drift competitions, drag races, gymkhana challenges, or rallies. Requires custom participant registration entries.',
    icon: Trophy,
    color: 'from-red-500/20 to-rose-500/10 border-red-500/30 text-red-500',
  },
  {
    id: 'Show & Shine',
    title: 'Show & Shine / Exhibition',
    description: 'Auto shows, audio system showdowns, custom build displays, or indoor showroom exhibitions.',
    icon: Store,
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
  },
]

const STATES = ['Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Putrajaya', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu']

export function CreateEventDialog() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'type-select' | 'form'>('type-select')
  const [selectedType, setSelectedType] = useState<string>('Car Meet')
  const [saving, setSaving] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  // Form State
  const [form, setForm] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    state: 'Selangor',
    externalLink: '',
    latitude: '',
    longitude: '',
    
    // Type-specific details template matching form layers
    ticketPrice: '',
    description: '',
    isMultipleDays: false,
    endDate: '',
    
    // Additional parameters template
    contactNumber: '',
    contactInstagram: '',
    slotsLimit: '',
    organizerName: '',
    allowedVehicles: '',
    parkingInfo: '',
    registrationLink: '',
  })

  // Map state and reference management for draggable pin pinpointing
  const mapElementRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerInstanceRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Debounce effect: Wait for 2 seconds after the user stops typing the location/state before auto-fetching
  useEffect(() => {
    if (step !== 'form' || !form.location.trim()) return

    const delayDebounceFn = setTimeout(() => {
      searchLocationCoordinates()
    }, 2000)

    return () => clearTimeout(delayDebounceFn)
  }, [form.location, form.state, step])

  // Load Map Instance when coordinate inputs are ready or manually fetched
  useEffect(() => {
    if (!open || step !== 'form' || !GOOGLE_MAPS_API_KEY || !mapElementRef.current) return

    let active = true
    const initialLat = parseFloat(form.latitude) || 3.1390 // Default PJ Malaysia
    const initialLng = parseFloat(form.longitude) || 101.6869

    getMapsLoader()
      .then((mapsLib) => {
        if (!active || !mapElementRef.current) return

        const position = { lat: initialLat, lng: initialLng }

        const map = new mapsLib.Map(mapElementRef.current, {
          center: position,
          zoom: form.latitude ? 15 : 10,
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#0A0A0A' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#0A0A0A' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#9CA3AF' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1F2937' }] },
            { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6B7280' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#111111' }] },
            { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#111111' }] },
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1A1A1A' }] },
            { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1F2937' }] },
          ],
          disableDefaultUI: true,
          zoomControl: true,
        })

        const marker = new mapsLib.Marker({
          position,
          map,
          draggable: true,
          title: 'Drag to staging spot!',
          icon: {
            path: 0, // Circle shape with nice cyan outline matching brand styling
            scale: 10,
            fillColor: '#06B6D4',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
        })

        mapInstanceRef.current = map
        markerInstanceRef.current = marker
        setMapLoaded(true)

        // Capture coordinates when the user finishes dragging the pin
        marker.addListener('dragend', () => {
          const newPos = marker.getPosition()
          if (newPos) {
            const dragLat = newPos.lat()
            const dragLng = newPos.lng()
            setForm((f) => ({
              ...f,
              latitude: dragLat.toFixed(6),
              longitude: dragLng.toFixed(6),
            }))
            toast.success(`Marker moved! Exact coordinates cached.`)
          }
        })

        // Also allow clicking anywhere on the map to snap the pin instantly
        map.addListener('click', (event: any) => {
          if (event.latLng) {
            const clickLat = event.latLng.lat()
            const clickLng = event.latLng.lng()
            marker.setPosition(event.latLng)
            setForm((f) => ({
              ...f,
              latitude: clickLat.toFixed(6),
              longitude: clickLng.toFixed(6),
            }))
          }
        })
      })
      .catch((err) => {
        console.error('Error loading Google Maps:', err)
      })

    return () => {
      active = false
    }
  }, [open, step])

  // Handle location search and geocoding simply or manually to keep it fully foolproof and accurate
  async function searchLocationCoordinates() {
    if (!form.location.trim()) {
      toast.error('Please enter a location name/address first')
      return
    }

    try {
      const address = `${form.location}, ${form.state}, Malaysia`
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`

      const res = await fetch(url)
      const data = await res.json()

      if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
        const { lat, lng } = data.results[0].geometry.location
        const latStr = lat.toFixed(6)
        const lngStr = lng.toFixed(6)

        setForm((f) => ({
          ...f,
          latitude: latStr,
          longitude: lngStr,
        }))

        // Move the map and pin to the resolved address instantly
        if (mapInstanceRef.current && markerInstanceRef.current) {
          const newPos = { lat, lng }
          mapInstanceRef.current.panTo(newPos)
          mapInstanceRef.current.setZoom(16)
          markerInstanceRef.current.setPosition(newPos)
        }

        toast.success(`Staging map synced! Drag the cyan pin on the map to pinpoint. 📍`)
      } else {
        toast.warning('Could not auto-fetch coordinates. Click anywhere on the map to set a custom staging location manual-style!')
      }
    } catch (err) {
      console.error(err)
      toast.error('Search API request failed. You can still pinpoint directly on the map.')
    }
  }

  // Posters multi-image gallery
  const [selectedFiles, setSelectedFiles] = useState<File[] | null>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)

  function set(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    const currentCount = selectedFiles ? selectedFiles.length : 0
    
    if (currentCount + files.length > 5) {
      toast.warning('Maximum 5 image posters allowed.')
      return
    }

    const nextFiles = [...(selectedFiles || []), ...files]
    setSelectedFiles(nextFiles)

    const urls = files.map((file) => URL.createObjectURL(file))
    setPreviews((prev) => [...prev, ...urls])
  }

  function removeImage(idx: number) {
    setSelectedFiles((prev) => (prev ? prev.filter((_, i) => i !== idx) : []))
    URL.revokeObjectURL(previews[idx])
    setPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleOpenType(typeId: string) {
    setSelectedType(typeId)
    setStep('form')
    
    // Pre-populate some quick templates to make creations super beautiful!
    if (typeId === 'Car Meet') {
      setForm(prev => ({
        ...prev,
        title: 'Midnight Coffee & Cars Staging',
        ticketPrice: 'Free',
        allowedVehicles: 'All clean builds welcome (JDM, Euro, Classic)',
        parkingInfo: 'Open parking spaces, park orderly.',
      }))
    } else if (typeId === 'Track Day') {
      setForm(prev => ({
        ...prev,
        title: 'Sepang Premium Open Track Session',
        ticketPrice: 'RM450',
        allowedVehicles: 'Track-ready machinery. Helmets mandatory.',
        parkingInfo: 'Pit garage allocation.',
      }))
    } else if (typeId === 'Race') {
      setForm(prev => ({
        ...prev,
        title: 'Battle of the Builds: Drag & Drift',
        ticketPrice: 'RM50',
        allowedVehicles: 'Registered drift/drag spec cars with rollcages.',
        parkingInfo: 'Paddock parking areas.',
      }))
    } else if (typeId === 'Show & Shine') {
      setForm(prev => ({
        ...prev,
        title: 'Exotic & Custom Car Festival Showcase',
        ticketPrice: 'RM15',
        allowedVehicles: 'Showcars, stance, and vintage retros.',
        parkingInfo: 'Indoor showroom platform.',
      }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!form.title.trim()) { toast.error('Event title is required'); return }
    if (!form.date) { toast.error('Event date is required'); return }
    if (!form.time) { toast.error('Event start time is required'); return }
    if (!form.location.trim()) { toast.error('Venue/Location is required'); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please sign in to create an event'); return }

    setSaving(true)
    setUploadingImages(true)

    const uploadedUrls: string[] = []
    try {
      if (selectedFiles && selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const ext = file.name.split('.').pop() || 'jpg'
          const path = `events/${user.id}/${Date.now()}_${Math.floor(Math.random() * 100000)}.${ext}`
          const { error: upErr } = await supabase.storage.from('user-content').upload(path, file, { cacheControl: '31536000' })
          if (upErr) throw upErr
          
          const { data: { publicUrl } } = supabase.storage.from('user-content').getPublicUrl(path)
          uploadedUrls.push(publicUrl)
        }
      }
    } catch (err: any) {
      toast.error('Image uploads failed', { description: err.message })
      setSaving(false)
      setUploadingImages(false)
      return
    }

    setUploadingImages(false)
    const bannerUrl = uploadedUrls[0] ?? null

    const latVal = form.latitude ? parseFloat(form.latitude) : null
    const lngVal = form.longitude ? parseFloat(form.longitude) : null

    const { error } = await supabase.from('events').insert({
      user_id: user.id,
      title: form.title.trim(),
      category: selectedType,
      date: form.date,
      time: form.time,
      location: form.location.trim(),
      state: form.state,
      external_link: form.externalLink.trim() || null,
      latitude: latVal,
      longitude: lngVal,
      
      price: form.ticketPrice.trim() || 'Free',
      ticket_price: parseFloat(form.ticketPrice) || null,
      description: form.description.trim() || null,
      is_multiple_days: form.isMultipleDays,
      end_date: form.isMultipleDays && form.endDate ? form.endDate : null,
      
      contact_number: form.contactNumber.trim() || null,
      contact_instagram: form.contactInstagram.trim() || null,
      slots_limit: parseInt(form.slotsLimit, 10) || null,
      organizer_name: form.organizerName.trim() || null,
      allowed_vehicles: form.allowedVehicles.trim() || null,
      parking_info: form.parkingInfo.trim() || null,
      
      images_gallery: uploadedUrls,
      banner_url: bannerUrl,
      status: 'upcoming',
    })

    if (error) {
      toast.error('Failed to create event', { description: error.message })
    } else {
      toast.success('Event published! 🚀', { description: `"${form.title}" is now live on the timeline.` })
      setOpen(false)
      setStep('type-select')
      setForm({
        title: '', date: '', time: '', location: '', state: 'Selangor', externalLink: '',
        latitude: '', longitude: '',
        ticketPrice: '', description: '', isMultipleDays: false, endDate: '',
        contactNumber: '', contactInstagram: '', slotsLimit: '', organizerName: '',
        allowedVehicles: '', parkingInfo: '', registrationLink: '',
      })
      setSelectedFiles([])
      setPreviews([])
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <>
      <button
        onClick={async () => {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) { toast.error('Sign in to create events'); return }
          setOpen(true)
        }}
        className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
      >
        <Plus size={16} />
        Create Event
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setOpen(false)} />
          <div className="relative bg-[#0d1017] border border-white/5 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
            
            {/* Header */}
            <div className="sticky top-0 bg-[#0d1017]/95 backdrop-blur-xs border-b border-white/5 px-6 py-4 flex items-center justify-between z-15">
              <div className="flex items-center gap-3">
                <CalendarDays size={20} className="text-[#06B6D4]" />
                <h2 className="font-bold text-text-primary text-base sm:text-lg" style={{ fontFamily: 'var(--font-orbitron)' }}>
                  {step === 'type-select' ? 'Select Event Category' : `Create ${selectedType}`}
                </h2>
              </div>
              <button 
                type="button" 
                onClick={() => setOpen(false)} 
                className="text-text-muted hover:text-text-primary transition-colors py-1 pl-3"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Switcher */}
            {step === 'type-select' ? (
              <div className="p-6 space-y-6">
                <div className="text-center max-w-md mx-auto space-y-2">
                  <p className="text-xs text-text-muted font-semibold tracking-wide">
                    Choose the type of automotive event you desire to run. Each configuration delivers customized parameters to optimize participant discovery.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {EVENT_TYPES.map((type) => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.id}
                        onClick={() => handleOpenType(type.id)}
                        className={`flex flex-col items-start text-left p-5 rounded-xl border bg-gradient-to-br ${type.color} hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all duration-300 group`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center shrink-0 mb-3.5 group-hover:scale-105 transition-transform">
                          <Icon size={20} />
                        </div>
                        <h3 className="font-bold text-sm text-text-primary mb-1.5 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-orbitron)' }}>
                          {type.title} <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </h3>
                        <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                          {type.description}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs font-semibold">
                
                {/* General Header Indicator */}
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/20 text-primary mb-2">
                  <BadgeInfo size={16} />
                  <span className="text-[11px]">You are initializing a <strong className="uppercase">{selectedType}</strong>. Fill in the fields below.</span>
                  <button 
                    type="button" 
                    onClick={() => { setStep('type-select'); router.refresh(); }} 
                    className="ml-auto text-text-primary hover:underline font-extrabold text-[10px]"
                  >
                    Change Type
                  </button>
                </div>

                {/* Grid Container */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Left Column: Basic Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-1.5">
                        Event Title <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        className="input w-full bg-linear-to-b from-black to-[#090b10] border border-white/10 rounded-lg p-2.5 text-white focus:border-primary/50 text-xs font-bold"
                        placeholder="e.g. PJ Staging Night Cars & Coffee"
                        value={form.title}
                        onChange={(e) => set('title', e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-1.5">
                          Venue / Location Address <span className="text-red-500 font-bold">*</span>
                        </label>
                        <div className="relative">
                          <input
                            className="input w-full bg-linear-to-b from-black to-[#090b10] border border-white/10 rounded-lg pl-8 pr-2.5 py-2.5 text-white focus:border-primary/50 text-xs"
                            placeholder="e.g. Starbucks, Petronas PJ Gate"
                            value={form.location}
                            onChange={(e) => set('location', e.target.value)}
                            required
                          />
                          <MapPin size={13} className="absolute left-2.5 top-3.5 text-text-muted" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-1.5">
                          Region / State <span className="text-red-500 font-bold">*</span>
                        </label>
                        <select
                          className="input w-full bg-linear-to-b from-black to-[#090b10] border border-white/10 rounded-lg p-2.5 text-white focus:border-primary/50 text-xs font-bold"
                          value={form.state}
                          onChange={(e) => set('state', e.target.value)}
                        >
                          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Find & Pinpoint Location Map (Interactive) */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest">Pinpoint staging / parking spot</label>
                        <button
                          type="button"
                          onClick={searchLocationCoordinates}
                          className="text-[10px] font-bold text-[#06B6D4] hover:underline flex items-center gap-1"
                        >
                          🚀 Auto-Find & Sync Pin
                        </button>
                      </div>

                      {/* Embedded Map Element */}
                      <div className="w-full h-48 bg-black rounded-lg border border-white/10 overflow-hidden relative">
                        <div
                          ref={mapElementRef}
                          className="absolute inset-0 w-full h-full"
                        />
                        {!mapLoaded && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-[10px] text-text-muted gap-2 z-10">
                            <div className="w-3.5 h-3.5 border-2 border-[#06B6D4] border-t-transparent animate-spin rounded-full" />
                            Loading Interactive Pinpoint Map...
                          </div>
                        )}
                      </div>
                      <p className="text-[9px] text-text-muted italic leading-tight">
                        💡 Tip: Type your location above and click &quot;Auto-Find&quot; to pan, then drag the cyan pin to mark correct entries/bays.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-[#888888] tracking-widest mb-1.5">Latitude (Auto-filled)</label>
                        <input
                          className="input w-full bg-black/40 border border-white/5 text-text-muted rounded-lg p-2.5 text-[10px] font-semibold cursor-not-allowed"
                          placeholder="Drag key map point"
                          value={form.latitude}
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-[#888888] tracking-widest mb-1.5">Longitude (Auto-filled)</label>
                        <input
                          className="input w-full bg-black/40 border border-white/5 text-text-muted rounded-lg p-2.5 text-[10px] font-semibold cursor-not-allowed"
                          placeholder="Drag key map point"
                          value={form.longitude}
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-1.5">
                          Date <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                          type="date"
                          className="input w-full bg-linear-to-b from-black to-[#090b10] border border-white/10 rounded-lg p-2.5 text-white focus:border-primary/50 text-xs"
                          value={form.date}
                          onChange={(e) => set('date', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-1.5">
                          Start Time <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                          type="time"
                          className="input w-full bg-linear-to-b from-black to-[#090b10] border border-white/10 rounded-lg p-2.5 text-white focus:border-primary/50 text-xs"
                          value={form.time}
                          onChange={(e) => set('time', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Custom Specifications */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-1.5">
                        Admission Pricing
                      </label>
                      <input
                        className="input w-full bg-linear-to-b from-black to-[#090b10] border border-white/10 rounded-lg p-2.5 text-white focus:border-primary/50 text-xs"
                        placeholder="e.g. Free or RM15"
                        value={form.ticketPrice}
                        onChange={(e) => set('ticketPrice', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-1.5">
                        Highlight Description
                      </label>
                      <textarea
                        className="input w-full bg-linear-to-b from-black to-[#090b10] border border-white/10 rounded-lg p-2.5 text-white focus:border-primary/50 text-xs resize-none"
                        rows={3}
                        placeholder="Detail rules, itinerary schedule, and meet highlights..."
                        value={form.description}
                        onChange={(e) => set('description', e.target.value)}
                      />
                    </div>

                    {/* Multi-image Poster selection */}
                    <div>
                      <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-1.5">
                        Posters / Gallery Images (Max 5)
                      </label>
                      <div className="border border-dashed border-white/10 hover:border-primary/30 rounded-xl p-3 flex flex-col items-center justify-center transition-colors">
                        <Upload size={18} className="text-text-muted mb-1.5" />
                        <label className="cursor-pointer text-primary hover:underline text-[10px] font-extrabold tracking-wider uppercase">
                          Upload Files
                          <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                        </label>
                        <span className="text-[9px] text-[#6B7280] mt-1 font-medium">PNG, JPG, WebP formats</span>
                      </div>

                      {previews.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          {previews.map((url, i) => (
                            <div key={url} className="relative w-12 h-12 rounded-lg border border-white/10 overflow-hidden shrink-0 bg-surface">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeImage(i)}
                                className="absolute -top-1 -right-1 bg-black/80 rounded-full p-0.5 border border-white/10 text-red-500"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Specifications Template fields customized per type */}
                    <div>
                      <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-1.5">
                        Allowed Automotive Builds
                      </label>
                      <input
                        className="input w-full bg-linear-to-b from-black to-[#090b10] border border-white/10 rounded-lg p-2.5 text-white focus:border-primary/50 text-xs"
                        placeholder="e.g. JDMs only, Euro stances, airrides..."
                        value={form.allowedVehicles}
                        onChange={(e) => set('allowedVehicles', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-1.5">
                        Parking / Access Info
                      </label>
                      <input
                        className="input w-full bg-linear-to-b from-black to-[#090b10] border border-white/10 rounded-lg p-2.5 text-white focus:border-primary/50 text-xs"
                        placeholder="e.g. Clean tarmac surface with marshals"
                        value={form.parkingInfo}
                        onChange={(e) => set('parkingInfo', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-1.5">
                          Contact Instagram
                        </label>
                        <input
                          className="input w-full bg-linear-to-b from-black to-[#090b10] border border-white/10 rounded-lg p-2.5 text-white focus:border-primary/50 text-xs"
                          placeholder="e.g. @revoluzion"
                          value={form.contactInstagram}
                          onChange={(e) => set('contactInstagram', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-1.5">
                          Contact Call/WhatsApp
                        </label>
                        <input
                          className="input w-full bg-linear-to-b from-black to-[#090b10] border border-white/10 rounded-lg p-2.5 text-white focus:border-primary/50 text-xs"
                          placeholder="e.g. +6012-345 6789"
                          value={form.contactNumber}
                          onChange={(e) => set('contactNumber', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-1.5">
                        Organizer Name (Team / Club label)
                      </label>
                      <input
                        className="input w-full bg-linear-to-b from-black to-[#090b10] border border-white/10 rounded-lg p-2.5 text-white focus:border-primary/50 text-xs"
                        placeholder="e.g. Revoluzion Malaysia Crew"
                        value={form.organizerName}
                        onChange={(e) => set('organizerName', e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="checkbox"
                        id="isMultipleDays"
                        className="rounded border-white/10 bg-black text-[#06B6D4] focus:ring-0 cursor-pointer h-4 w-4"
                        checked={form.isMultipleDays}
                        onChange={(e) => set('isMultipleDays', e.target.checked)}
                      />
                      <label htmlFor="isMultipleDays" className="text-[10px] font-black uppercase text-text-secondary tracking-wider cursor-pointer font-mono" style={{ fontFamily: 'var(--font-orbitron)' }}>
                        This is a Multi-Day Event
                      </label>
                    </div>

                    {form.isMultipleDays && (
                      <div className="animate-scale-in">
                        <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-1.5">
                          Ending Date <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                          type="date"
                          className="input w-full bg-linear-to-b from-black to-[#090b10] border border-white/10 rounded-lg p-2.5 text-white focus:border-primary/50 text-xs animate-scale-in"
                          value={form.endDate}
                          onChange={(e) => set('endDate', e.target.value)}
                          required={form.isMultipleDays}
                        />
                      </div>
                    )}
                  </div>

                </div>

                {/* Footer buttons grid layout */}
                <div className="flex flex-col sm:flex-row gap-2 pt-5 border-t border-white/5 justify-end">
                  <button
                    type="button"
                    onClick={() => setStep('type-select')}
                    className="px-4 py-2.5 bg-transparent border border-white/10 hover:bg-white/5 rounded-xl text-xs font-semibold text-text-muted transition-colors order-2 sm:order-1"
                  >
                    Back to Selection
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary py-2.5 rounded-xl text-xs font-bold px-8 order-1 sm:order-2"
                  >
                    {saving ? 'Creating Event...' : 'Publish Event'}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}
    </>
  )
}