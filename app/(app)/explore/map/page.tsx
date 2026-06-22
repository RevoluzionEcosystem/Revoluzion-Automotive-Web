'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation } from 'lucide-react'

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
  const [mapLoaded, setMapLoaded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError(true)
      return
    }

    ;(async () => {
      try {
        const { Loader } = await import('@googlemaps/js-api-loader')
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
        })
        const mapsLib = (await (loader as any).importLibrary('maps')) as any
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
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        })

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

          const infoContent = `<div style="background:#111111;border:1px solid #1F2937;border-radius:8px;padding:12px;min-width:160px;font-family:Inter,sans-serif;"><div style="font-weight:600;color:#FFFFFF;font-size:14px;margin-bottom:4px;">${loc.title}</div><div style="color:#9CA3AF;font-size:12px;">${loc.description}</div><div style="display:inline-block;margin-top:6px;padding:2px 8px;background:${color}20;color:${color};border-radius:4px;font-size:11px;">${loc.type.charAt(0).toUpperCase() + loc.type.slice(1)}</div></div>`

          const infoWindow = new mapsLib.InfoWindow({ content: infoContent })
          marker.addListener('click', () => infoWindow.open(map, marker))
        }

        setMapLoaded(true)
      } catch {
        setError(true)
      }
    })()
  }, [])

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-64px)]">
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
      </div>
    </div>
  )
}
