'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, Plus, Minus, Maximize } from 'lucide-react'
import { getMapsLoader } from '@/lib/google-maps-loader'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!

// Sample workshop pins — in production these would come from Supabase
const SAMPLE_LOCATIONS = [
  { lat: 3.1390, lng: 101.6869, title: 'Revoluzion HQ', type: 'hub', description: 'Headquarters' },
  { lat: 3.1478, lng: 101.6953, title: 'KL Auto Workshop', type: 'workshop', description: 'Full-service workshop' },
  { lat: 3.1215, lng: 101.6556, title: 'Circuit Meet Spot', type: 'meet', description: 'Monthly car meet' },
  { lat: 3.0738, lng: 101.5183, title: 'Subang Performance', type: 'workshop', description: 'Performance tuning' },
  { lat: 3.1580, lng: 101.7120, title: 'Ampang Detail Studio', type: 'workshop', description: 'Detailing & wraps' },
]

const PIN_COLORS: Record<string, string> = {
  hub: '#06B6D4',
  workshop: '#14B8A6',
  meet: '#F59E0B',
  default: '#9CA3AF',
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<{ setZoom: (z: number) => void; getZoom: () => number | undefined } | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError(true)
      return
    }

    ;(async () => {
      try {
        const mapsLib = await getMapsLoader()
        if (!mapRef.current) return

        const map = new mapsLib.Map(mapRef.current, {
          center: { lat: 3.1390, lng: 101.6869 },
          zoom: 12,
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
          disableDefaultUI: false,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })

        mapInstanceRef.current = map

        // Add markers
        for (const loc of SAMPLE_LOCATIONS) {
          const color = PIN_COLORS[loc.type] || PIN_COLORS.default
          const marker = new mapsLib.Marker({
            position: { lat: loc.lat, lng: loc.lng },
            map,
            title: loc.title,
            icon: {
              path: 0, // google.maps.SymbolPath.CIRCLE = 0
              scale: 8,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: '#0A0A0A',
              strokeWeight: 2,
            },
          })

          const searchAddress = loc.title
          const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${loc.lat},${loc.lng}`)}&theme=dark`
          const wazeUrl = `https://waze.com/ul?ll=${loc.lat},${loc.lng}&q=${encodeURIComponent(searchAddress)}&navigate=yes`

          const infoContent = `
            <div style="background:#111111; border:1px solid #1F2937; border-radius:12px; padding:12px; width:220px; font-family:Inter, sans-serif; text-align:left; color:#ffffff;">
              <div style="font-weight:700; color:#FFFFFF; font-size:14px; margin-bottom:4px; font-family: var(--font-orbitron); text-transform: uppercase;">
                ${loc.title}
              </div>
              <div style="color:#9CA3AF; font-size:11px; margin-bottom:8px; line-height:1.35;">
                ${loc.description}
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="display:inline-block; padding:2px 8px; background:${color}20; color:${color}; border-radius:4px; font-size:10px; font-weight:800; text-transform:uppercase;">
                  ${loc.type}
                </span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background-color: #06B6D4; color: #000000; text-decoration: none; padding: 5px 0; border-radius: 6px; font-size: 10px; font-weight: 900; text-transform: uppercase; font-family: var(--font-orbitron);">
                  GO NOW
                </a>
                <a href="${wazeUrl}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background-color: #1f2937; color: #ffffff; text-decoration: none; padding: 5px 0; border-radius: 6px; font-size: 10px; font-weight: 700; border: 1px solid #374151; text-transform: uppercase; font-family: var(--font-orbitron);">
                  WAZE
                </a>
              </div>
            </div>
          `

          const infoWindow = new mapsLib.InfoWindow({ content: infoContent })
          marker.addListener('click', () => infoWindow.open(map, marker))
        }

        setMapLoaded(true)
      } catch {
        setError(true)
      }
    })()
  }, [])

  function zoomIn() {
    const m = mapInstanceRef.current
    if (m) m.setZoom((m.getZoom() ?? 12) + 1)
  }

  function zoomOut() {
    const m = mapInstanceRef.current
    if (m) m.setZoom((m.getZoom() ?? 12) - 1)
  }

  function toggleFullscreen() {
    const el = mapRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else el.requestFullscreen()
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100dvh-64px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <MapPin size={16} className="text-primary" />
        </div>
        <div>
          <h1 className="font-semibold text-text-primary text-sm">Explore Map</h1>
          <div className="text-text-muted text-xs">Workshops, meets & community spots</div>
        </div>

        {/* Legend */}
        <div className="ml-auto hidden sm:flex items-center gap-4 text-xs text-text-muted">
          {Object.entries(PIN_COLORS).filter(([k]) => k !== 'default').map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted bg-background">
            <MapPin size={40} className="mb-3 opacity-30" />
            <p>Map unavailable</p>
            <p className="text-xs mt-1">Google Maps API key not configured</p>
          </div>
        )}
        {!mapLoaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted bg-background">
            <Navigation size={32} className="mb-3 animate-spin opacity-50" />
            <p className="text-sm">Loading map...</p>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />

        {/* Compact map controls */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
          <button
            onClick={zoomIn}
            aria-label="Zoom in"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-surface/90 backdrop-blur border border-border text-text-secondary hover:text-white hover:border-primary/50 flex items-center justify-center shadow-lg transition-colors"
          >
            <Plus size={15} />
          </button>
          <button
            onClick={zoomOut}
            aria-label="Zoom out"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-surface/90 backdrop-blur border border-border text-text-secondary hover:text-white hover:border-primary/50 flex items-center justify-center shadow-lg transition-colors"
          >
            <Minus size={15} />
          </button>
          <button
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
            className="mt-1 w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-surface/90 backdrop-blur border border-border text-text-secondary hover:text-white hover:border-primary/50 flex items-center justify-center shadow-lg transition-colors"
          >
            <Maximize size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
