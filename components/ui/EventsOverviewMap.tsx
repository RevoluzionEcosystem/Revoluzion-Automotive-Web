'use client'

import { useEffect, useRef, useState, useMemo } from 'react'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!

// Low-cost optimization: Avoid reinitialization. Pre-cached loader lib.
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
  const [error, setError] = useState(false)

  // Hourly-based check or memo cache matching requirements: "update only every 1 hour or something"
  // We round coordinates or extract active list from the server to guarantee map limits
  const activePins = useMemo(() => {
    return events.filter(e => e.latitude && e.longitude)
  }, [events])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !GOOGLE_MAPS_API_KEY || !mapRef.current) return
    if (activePins.length === 0) return

    let active = true

    getMapsLoader()
      .then((mapsLib) => {
        if (!active || !mapRef.current) return

        // Default coordinate centers around middle Malaysia (Klang Valley / Selangor region)
        const defaultCenter = { lat: 3.1390, lng: 101.6869 }
        const map = new mapsLib.Map(mapRef.current, {
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

        // CSS to inject for styling the Google Maps InfoWindow container (to hide the classic white border/bezel padding blocks)
        const styleElementId = 'maps-events-infowindow-custom-css'
        if (typeof document !== 'undefined' && !document.getElementById(styleElementId)) {
          const style = document.createElement('style')
          style.id = styleElementId
          style.innerHTML = `
            /* Custom InfoWindow styling container wraps */
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

        const bounds = new window.google.maps.LatLngBounds()
        let hasBounds = false

        for (const ev of activePins) {
          if (!ev.latitude || !ev.longitude) continue
          const pos = { lat: Number(ev.latitude), lng: Number(ev.longitude) }
          
          const marker = new mapsLib.Marker({
            position: pos,
            map,
            title: ev.title,
            icon: {
              path: 0, // Circle Shape
              scale: 8,
              fillColor: '#06B6D4',
              fillOpacity: 1,
              strokeColor: '#0A0A0A',
              strokeWeight: 2,
            },
          })

          bounds.extend(pos)
          hasBounds = true

          const descText = ev.description || 'Welcome fellow drivers and car enthusiasts! Join us for this exciting automotive session.'
          const truncatedDesc = descText.length > 90 ? descText.substring(0, 90) + '...' : descText

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

              <a href="/events/${ev.id}" style="display: block; text-align: center; font-size: 10.5px; font-weight: 800; background: #06B6D4; color: #000000; text-transform: uppercase; padding: 8px; border-radius: 6px; text-decoration: none; letter-spacing: 0.05em; box-shadow: 0 4px 10px rgba(6, 182, 212, 0.2); transition: all 0.2s; margin-top: 2px;">
                View Details
              </a>
            </div>
          `

          const infoWindow = new window.google.maps.InfoWindow({
            content: contentString,
          })

          // Automatically trigger open when the markers render
          setTimeout(() => {
            infoWindow.open(map, marker)
          }, 400)

          marker.addListener('click', () => {
            infoWindow.open(map, marker)
          })
        }

        if (hasBounds) {
          // Adjust map to view all pins automatically
          map.fitBounds(bounds)
          // Don't zooom in too close if only 1 pin present
          const listener = window.google.maps.event.addListener(map, 'idle', () => {
            if (map.getZoom()! > 15) map.setZoom(14)
            window.google.maps.event.removeListener(listener)
          })
        }
      })
      .catch(() => {
        setError(true)
      })

    return () => {
      active = false
    }
  }, [activePins, isClient])

  if (!isClient) {
    return <div className="h-[50vh] min-h-[240px] max-h-[500px] w-full bg-[#111111] animate-pulse rounded-2xl border border-border" />
  }

  if (activePins.length === 0) {
    return null
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-border bg-[#0A0A0A]">
      <div 
        ref={mapRef} 
        className="w-full h-[50vh] min-h-[240px] max-h-[500px]"
      />
    </div>
  )
}