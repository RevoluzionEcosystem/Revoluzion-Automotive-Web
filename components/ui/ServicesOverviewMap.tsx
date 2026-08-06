/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { Map, Search, Info, X } from 'lucide-react'
import { getMapsLoader } from '@/lib/google-maps-loader'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!

export interface ServiceMarker {
  id: string
  title: string
  location: string | null
  description: string | null
  latitude: number | null
  longitude: number | null
  category: string
  price?: number | string | null
}

interface Props {
  services: ServiceMarker[]
}

export function ServicesOverviewMap({ services }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)
  const [mapInstance, setMapInstance] = useState<unknown | null>(null)
  const [markersRefs, setMarkersRefs] = useState<unknown[]>([])
  const [expanded, setExpanded] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter pins based on user manual search text input (case insensitive match on title, description, category or location)
  const searchFilteredPins = useMemo(() => {
    return services.filter((s) => {
      if (!s.latitude || !s.longitude) return false
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return (
        s.title.toLowerCase().includes(query) ||
        (s.description || '').toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        (s.location || '').toLowerCase().includes(query)
      )
    })
  }, [services, searchQuery])

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Clear older markers from map before overlaying new pins
  const clearMarkers = (refs: unknown[]) => {
    refs.forEach((m) => (m as { setMap: (map: unknown | null) => void }).setMap(null))
  }

  const initMapAndPins = (mapsLib: any) => {
    if (!mapRef.current) return

    const defaultCenter = { lat: 3.1390, lng: 101.6869 } // Selangor / Klang Valley
    const map = new (mapsLib as any).Map(mapRef.current, {
      center: defaultCenter,
      zoom: 10,
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

    setMapInstance(map)
    renderMarkers(mapsLib, map, searchFilteredPins)
  }

  const renderMarkers = (mapsLib: any, map: any, pins: ServiceMarker[]) => {
    // Clear old markers first
    clearMarkers(markersRefs)

    const bounds = new window.google.maps.LatLngBounds()
    let hasBounds = false
    const newMarkers: unknown[] = []

    const infoWindow = new (mapsLib as any).InfoWindow({
      maxWidth: 320
    })

    // Custom CSS for InfoWindow
    const styleId = 'maps-services-infowindow-custom-css'
    if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.innerHTML = `
        .gm-style .gm-style-iw-c {
          background-color: #111111 !important;
          border: 1px solid #1f2937 !important;
          padding: 0 !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
          border-radius: 12px !important;
        }
        .gm-style .gm-style-iw-d {
          overflow: hidden !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .gm-style .gm-style-iw-tc::after {
          background-color: #111111 !important;
          border-left: 1px solid #1f2937 !important;
          border-bottom: 1px solid #1f2937 !important;
        }
        .gm-ui-hover-close {
          background-color: #1f2937 !important;
          border-radius: 10px !important;
          margin: 6px !important;
          opacity: 0.8 !important;
          outline: none !important;
        }
        .gm-ui-hover-close span {
          background-color: #ffffff !important;
        }
      `
      document.head.appendChild(style)
    }

    pins.forEach((p) => {
      if (!p.latitude || !p.longitude) return

      const pos = { lat: Number(p.latitude), lng: Number(p.longitude) }
      bounds.extend(pos)
      hasBounds = true

      // Create neon-styled pin icon SVG based on category
      const pinColor = p.category === 'workshop' ? '#06b6d4' : p.category === 'car_wash' ? '#10b981' : '#f59e0b'
      const svgMarker = {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        fillColor: pinColor,
        fillOpacity: 1,
        strokeWeight: 1.5,
        strokeColor: '#ffffff',
        scale: 1.5,
        anchor: new window.google.maps.Point(12, 22),
      }

      const marker = new (mapsLib as any).Marker({
        position: pos,
        map: map,
        title: p.title,
        icon: svgMarker,
        animation: window.google.maps.Animation.DROP
      }) as { addListener: (evt: string, cb: () => void) => void }

      // Generate Navigation URLs
      const searchAddress = p.location ? `${p.title}, ${p.location}` : p.title
      const coordinateFocus = `${p.latitude},${p.longitude}`
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinateFocus)}&theme=dark`
      const wazeUrl = `https://waze.com/ul?ll=${p.latitude},${p.longitude}&q=${encodeURIComponent(searchAddress)}&navigate=yes`

      const content = `
        <div style="font-family: inherit; background-color: #111111; color: #ffffff; padding: 16px; border-radius: 12px; width: 280px; text-align: left;">
          <span style="font-size: 9px; font-weight: 900; background-color: ${pinColor}22; color: ${pinColor}; border: 1px solid ${pinColor}44; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.8px; font-family: var(--font-orbitron);">
            ${p.category.replace('_', ' ')}
          </span>
          <h4 style="font-size: 13px; font-weight: 800; margin: 8px 0 4px 0; color: #ffffff; line-height: 1.35; font-family: var(--font-orbitron); text-transform: uppercase;">
            ${p.title.replace(' [SeedMock]', '')}
          </h4>
          <p style="font-size: 10px; color: #9ca3af; margin: 0 0 10px 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${p.description || 'No description listed.'}
          </p>
          <div style="font-size: 10px; font-weight: 600; color: #f3f4f6; margin-bottom: 12px; display: flex; align-items: center; gap: 4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: ${pinColor};"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            ${p.location || 'Klang Valley'}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; text-align: center; background-color: #06B6D4; color: #000000; text-decoration: none; padding: 6px 0; border-radius: 6px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.4px;">
              GO NOW
            </a>
            <a href="${wazeUrl}" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; text-align: center; background-color: #1f2937; color: #ffffff; text-decoration: none; padding: 6px 0; border-radius: 6px; font-size: 10px; font-weight: 700; border: 1px solid #374151; text-transform: uppercase; letter-spacing: 0.4px;">
              Waze Nav
            </a>
          </div>
          <button onclick="navigator.clipboard.writeText('${googleMapsUrl}'); alert('Google Maps location copied to clipboard! 📋');" style="display: block; width: 100%; margin-top: 6px; text-align: center; background-color: transparent; color: #6b7280; text-decoration: none; padding: 5px 0; border: 1px dashed #374151; border-radius: 6px; font-size: 9px; font-weight: 600; cursor: pointer; text-transform: uppercase;">
            Copy Direct Link
          </button>
        </div>
      `

      marker.addListener('click', () => {
        infoWindow.setContent(content)
        infoWindow.open(map, marker)
      })

      newMarkers.push(marker)
    })

    setMarkersRefs(newMarkers)

    if (hasBounds && map) {
      if (pins.length === 1) {
        map.setCenter(bounds.getCenter())
        map.setZoom(13)
      } else {
        map.fitBounds(bounds)
      }
    }
  }

  // Trigger Google map updates when pins or expansions are toggled
  useEffect(() => {
    if (!isClient || !expanded || !GOOGLE_MAPS_API_KEY) {
      // Clear reference to old map instance if collapsed to trigger proper full redraw on next mount
      if (!expanded) {
        setMapInstance(null)
      }
      return
    }

    let active = true
    getMapsLoader()
      .then((mapsLib: any) => {
        if (!active) return
        if (!mapInstance) {
          initMapAndPins(mapsLib)
        } else {
          renderMarkers(mapsLib, mapInstance, searchFilteredPins)
        }
      })
      .catch((err) => {
        console.error('Error loading Google Maps:', err)
      })

    return () => {
      active = false
    }
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, isClient, searchFilteredPins, mapInstance])

  if (!isClient) return null

  return (
    <div className="border border-border/80 rounded-2xl bg-surface/30 overflow-hidden shadow-xl">
      
      {/* Header and Toggle of the map view */}
      <div className="p-4 bg-linear-to-b from-[#181d29] to-[#0d1017] border-b border-border/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <Map size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white uppercase tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>
              Interactive Services Map Navigator
            </h3>
            <p className="text-[10px] text-text-muted">Search for workshops, car washes, paints & copy direct navigation coordinates instantly</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className={`px-4 py-2 font-black uppercase text-[9px] tracking-widest rounded-xl border transition-all duration-200 cursor-pointer ${
              expanded
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-black border-slate-800 text-white hover:border-slate-700'
            }`}
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            {expanded ? 'Hide Map Matrix' : 'Load Interactive Map'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="relative">
          {/* Centered map internal search bar placed below the map title block and above/on top of the map layer */}
          <div className="bg-[#0b0c10]/95 border-b border-border/40 px-4 py-3 flex justify-center">
            <div className="relative w-full max-w-2xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workshops, tires, paint details inside map pinpoints..."
                className="w-full h-11 pl-11 pr-10 rounded-2xl bg-black border border-primary/40 focus:border-primary text-xs text-white placeholder-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary/25 transition-all shadow-lg"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {searchFilteredPins.length === 0 && searchQuery && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xs p-6 text-center">
              <Info size={24} className="text-primary/30 mb-2" />
              <p className="text-xs font-bold uppercase text-white tracking-widest" style={{ fontFamily: 'var(--font-orbitron)' }}>No markers match search</p>
              <p className="text-[10px] text-text-muted mt-1">Reset your query search keywords to see physical pinpoint locations.</p>
            </div>
          )}
          <div ref={mapRef} className="w-full h-112 bg-black" />
        </div>
      )}
    </div>
  )
}
