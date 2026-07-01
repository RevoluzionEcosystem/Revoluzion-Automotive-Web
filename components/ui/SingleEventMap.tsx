'use client'

import { useEffect, useRef, useState } from 'react'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!

// Low-cost cache logic to avoid excessive API requests. Map instances are loaded on-demand,
// and we store the library promise in window to reuse it across components & page renders.
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

interface EventMapProps {
  latitude?: number | null
  longitude?: number | null
  locationName: string
  stateName?: string | null
}

export function SingleEventMap({ latitude, longitude, locationName, stateName }: EventMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !GOOGLE_MAPS_API_KEY || !mapRef.current) return

    // If coordinates are missing, we don't render maps initialization to save quota/load
    if (!latitude || !longitude) return

    let active = true

    getMapsLoader()
      .then((mapsLib) => {
        if (!active || !mapRef.current) return

        const position = { lat: Number(latitude), lng: Number(longitude) }

        const map = new mapsLib.Map(mapRef.current, {
          center: position,
          zoom: 15,
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

        new mapsLib.Marker({
          position,
          map,
          title: locationName,
          icon: {
            path: 0, // Circle shape
            scale: 9,
            fillColor: '#06B6D4', // cyan brand
            fillOpacity: 1,
            strokeColor: '#0A0A0A',
            strokeWeight: 2,
          },
        })
      })
      .catch(() => {
        setError(true)
      })

    return () => {
      active = false
    }
  }, [latitude, longitude, locationName, isClient])

  if (!isClient) return <div className="h-48 w-full bg-[#111111] animate-pulse rounded-xl border border-border" />

  const searchAddress = `${locationName}${stateName ? `, ${stateName}` : ''}`
  // Adding coordinates if available, and query coordinates or address.
  // To open Google Maps in night/dark mode style via intent preferences where supported:
  // Note that Google Maps accepts custom styling query parameters or a search coordinate focus:
  const coordinateQuery = latitude && longitude ? `${Number(latitude)},${Number(longitude)}` : searchAddress
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinateQuery)}&theme=dark`
  const wazeUrl = `https://waze.com/ul?ll=${latitude && longitude ? `${Number(latitude)},${Number(longitude)}` : ''}&q=${encodeURIComponent(searchAddress)}&navigate=yes`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(googleMapsUrl)
    toast.success('Google Maps URL copied to clipboard! 📋')
  }

  // Fallback if no lat/lng coordinates are provided
  if (!latitude || !longitude) {
    return (
      <div className="card p-4 border border-border bg-surface text-center space-y-3">
        <p className="text-xs text-text-muted">No precise map coordinates were set by the organizer for this venue.</p>
        <div className="flex flex-wrap gap-2 justify-center">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary py-1.5 px-3 text-[11px] font-bold rounded-lg uppercase tracking-wider inline-flex items-center gap-1.5"
          >
            Google Maps
          </a>
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary py-1.5 px-3 text-[11px] font-bold rounded-lg uppercase tracking-wider inline-flex items-center gap-1.5"
          >
            Waze Maps
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div 
        ref={mapRef} 
        className="w-full h-48 rounded-xl overflow-hidden border border-border bg-[#0A0A0A]"
      />
      
      <div className="grid grid-cols-3 gap-2">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-[11px] py-2 font-bold uppercase tracking-wider text-center"
        >
          Google Map
        </a>
        <a
          href={wazeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-[11px] py-2 font-bold uppercase tracking-wider text-center"
        >
          Waze Nav
        </a>
        <button
          onClick={handleCopyLink}
          type="button"
          className="btn-primary text-[11px] py-2 font-bold uppercase tracking-wider text-center"
        >
          Copy Link
        </button>
      </div>
    </div>
  )
}

// toast reference support setup
import { toast } from 'sonner'