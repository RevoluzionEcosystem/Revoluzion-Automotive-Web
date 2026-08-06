/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { Map, Search, Info, X } from 'lucide-react'
import { getMapsLoader } from '@/lib/google-maps-loader'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!

interface EventMarker {
  id: string
  title: string
  location: string
  state?: string | null
  latitude: number | null
  longitude: number | null
  category: string
  date?: string | null
  time?: string | null
  description?: string | null
}

export function EventsOverviewMap({ events }: { events: EventMarker[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [markersRefs, setMarkersRefs] = useState<any[]>([])
  const [expanded, setExpanded] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter pins based on user manual search text input (case insensitive match on title, description, category or location)
  const searchFilteredPins = useMemo(() => {
    return events.filter((s) => {
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
  }, [events, searchQuery])

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Clear older markers from map before overlaying new pins
  const clearMarkers = (refs: any[]) => {
    refs.forEach((m) => m.setMap(null))
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

  const renderMarkers = (mapsLib: any, map: any, pins: EventMarker[]) => {
    // Clear old markers first
    clearMarkers(markersRefs)

    const bounds = new window.google.maps.LatLngBounds()
    let hasBounds = false
    const newMarkers: any[] = []

    // Custom CSS for InfoWindow styling container wraps
    const styleElementId = 'maps-events-infowindow-custom-css'
    if (typeof document !== 'undefined' && !document.getElementById(styleElementId)) {
      const style = document.createElement('style')
      style.id = styleElementId
      style.innerHTML = `
        .gm-style .gm-style-iw-c {
          background-color: #111111 !important;
          border: 1px solid #1f2937 !important;
          padding: 0 !important;
          max-width: 320px !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
        }
        .gm-style .gm-style-iw-d {
          overflow: hidden !important;
          padding: 12px !important;
        }
        .gm-style .gm-style-iw-tc::after {
          background: #111111 !important;
          border: 1px solid #1f2937 !important;
        }
        .gm-ui-hover-effect {
          top: 8px !important;
          right: 8px !important;
          background: rgba(255,255,255,0.05) !important;
          border-radius: 50% !important;
          width: 20px !important;
          height: 20px !important;
        }
        .gm-ui-hover-effect > span {
          background-color: #9CA3AF !important;
          margin: 4px !important;
        }
      `
      document.head.appendChild(style)
    }

    pins.forEach((ev) => {
      if (!ev.latitude || !ev.longitude) return

      const pos = { lat: Number(ev.latitude), lng: Number(ev.longitude) }
      bounds.extend(pos)
      hasBounds = true

      const marker = new (mapsLib as any).Marker({
        position: pos,
        map: map,
        title: ev.title,
        icon: {
          path: 0, // Circle Shape
          scale: 9,
          fillColor: '#06B6D4',
          fillOpacity: 1,
          strokeColor: '#0A0A0A',
          strokeWeight: 2,
        },
      }) as { addListener: (evt: string, cb: () => void) => void }

      const descText = ev.description || 'Welcome fellow drivers and car enthusiasts! Join us for this exciting automotive session.'
      const truncatedDesc = descText.length > 90 ? descText.substring(0, 90) + '...' : descText

      // Generate navigation links
      const searchAddress = ev.state ? `${ev.location}, ${ev.state}` : ev.location
      const coordinateFocus = `${ev.latitude},${ev.longitude}`
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinateFocus)}&theme=dark`
      const wazeUrl = `https://waze.com/ul?ll=${ev.latitude},${ev.longitude}&q=${encodeURIComponent(searchAddress)}&navigate=yes`

      const contentString = `
        <div style="font-family: var(--font-inter), sans-serif; color: #FFFFFF; width: 280px; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-weight: 800; font-size: 15px; line-height: 1.25; color: #FFFFFF; font-family: var(--font-orbitron), sans-serif; letter-spacing: -0.01em;">
            ${ev.title}
          </div>

          <div style="font-size: 11px; color: #9CA3AF; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 32px;">
            ${truncatedDesc}
          </div>

          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 8px; display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 10px; color: #D1D5DB; display: flex; align-items: center; gap: 4px;">
              📅 <strong style="color: #6B7280; font-weight: 600;">Schedule:</strong> ${ev.date || 'TBD'}${ev.time ? ` at ${ev.time}` : ''}
            </div>
            <div style="font-size: 10px; color: #D1D5DB; display: flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              📍 <strong style="color: #6B7280; font-weight: 600;">Venue:</strong> ${ev.location}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 4px;">
            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background-color: #06B6D4; color: #000000; text-decoration: none; padding: 6px 0; border-radius: 6px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.4px; font-family: var(--font-orbitron);">
              GO NOW
            </a>
            <a href="${wazeUrl}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background-color: #1f2937; color: #ffffff; text-decoration: none; padding: 6px 0; border-radius: 6px; font-size: 10px; font-weight: 700; border: 1px solid #374151; text-transform: uppercase; letter-spacing: 0.4px; font-family: var(--font-orbitron);">
              Waze Nav
            </a>
          </div>

          <a href="/events/${ev.id}" style="display: block; text-align: center; font-size: 10.5px; font-weight: 800; background: #1f2937; color: #ffffff; text-transform: uppercase; padding: 8px; border-radius: 6px; text-decoration: none; letter-spacing: 0.05em; transition: all 0.2s; margin-top: 2px; border: 1px solid #374151;">
            View Details
          </a>
        </div>
      `

      const infoWindow = new (mapsLib as any).InfoWindow({
        content: contentString,
      })

      marker.addListener('click', () => {
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

  useEffect(() => {
    if (!isClient || !expanded || !GOOGLE_MAPS_API_KEY) {
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
    <div className="border border-border/80 rounded-2xl bg-surface/30 overflow-hidden shadow-xl w-full">
      
      {/* Header and Toggle of the map view */}
      <div className="p-4 bg-linear-to-b from-[#181d29] to-[#0d1017] border-b border-border/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary animate-pulse">
            <Map size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white uppercase tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>
              Interactive Car Meets Map Navigator
            </h3>
            <p className="text-[10px] text-text-muted">Locate track days, dyno sessions, and automotive convoys live across Malaysia</p>
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
        <div className="relative w-full">
          {/* Centered map internal search bar placed below the map title block and on top of map layer */}
          <div className="bg-[#0b0c10]/95 border-b border-border/40 px-4 py-3 flex justify-center">
            <div className="relative w-full max-w-2xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracks, dyno meets, and car gather venue pins inside map..."
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