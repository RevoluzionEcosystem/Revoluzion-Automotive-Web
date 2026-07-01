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

export function RealTimeEventsMap({ events }: { events: EventMarker[] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapElementRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const activePins = useMemo(() => {
    return events.filter(e => e.latitude && e.longitude)
  }, [events])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !GOOGLE_MAPS_API_KEY || !mapElementRef.current) return
    if (activePins.length === 0) return

    let active = true

    getMapsLoader()
      .then((mapsLib) => {
        if (!active || !mapElementRef.current) return

        // Selangor / Klang Valley center
        const defaultCenter = { lat: 3.1390, lng: 101.6869 }
        const map = new mapsLib.Map(mapElementRef.current, {
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

        // Set padding at the bottom of the map (this offsets visual elements like InfoWindows and center views)
        map.setPadding({ top: 0, right: 0, bottom: 80, left: 0 })

        const bounds = new window.google.maps.LatLngBounds()
        let hasBounds = false

        // Get system datetime to check live status
        const now = new Date()
        const todayStr = now.toISOString().split('T')[0] // yyyy-mm-dd

        for (const ev of activePins) {
          if (!ev.latitude || !ev.longitude) continue
          const pos = { lat: Number(ev.latitude), lng: Number(ev.longitude) }

          // Determine if event is happening "Live / Ongoing" or "Upcoming"
          const isToday = ev.date === todayStr
          
          // Let's create a pulsing or highlighted green/cyan look for on-going / today
          const markerColor = isToday ? '#10B981' : '#06B6D4' // Emerald green for Live/Ongoing vs Cyan for upcoming
          const markerScale = isToday ? 10 : 8
          const strokeColor = isToday ? '#FFFFFF' : '#0A0A0A'

          const marker = new mapsLib.Marker({
            position: pos,
            map,
            title: ev.title,
            icon: {
              path: 0, // Circle Shape
              scale: markerScale,
              fillColor: markerColor,
              fillOpacity: 1,
              strokeColor: strokeColor,
              strokeWeight: 2,
            },
          })

          bounds.extend(pos)
          hasBounds = true

          // CSS to inject for styling the Google Maps InfoWindow container (to hide the classic white border/bezel padding blocks)
          const styleElementId = 'maps-infowindow-custom-css'
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
              @keyframes dotPulse {
                0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
                100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
              }
              .live-flashing-dot {
                background-color: #10B981;
                width: 7px;
                height: 7px;
                border-radius: 50%;
                display: inline-block;
                animation: dotPulse 1.8s infinite;
              }
            `
            document.head.appendChild(style)
          }

          const descText = ev.description ? ev.description : 'Join other active members and car enthusiasts at this Selangor staging meetup. Click to view.'
          const truncatedDesc = descText.length > 140 ? descText.substring(0, 140) + '...' : descText

          const contentString = `
            <div style="font-family: var(--font-inter), sans-serif; color: #FFFFFF; width: 280px; display: flex; flex-col; gap: 8px;">
              
              {/* Header tags badge */}
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; width: 100%;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  ${isToday ? `
                    <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 8.5px; font-weight: 900; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); padding: 2px 7px; border-radius: 4px; text-transform: uppercase;">
                      <span class="live-flashing-dot"></span> ONGOING / TODAY
                    </span>
                  ` : `
                    <span style="display: inline-flex; align-items: center; font-size: 8.5px; font-weight: 900; background: rgba(6, 182, 212, 0.15); color: #06B6D4; border: 1px solid rgba(6, 182, 212, 0.3); padding: 2px 7px; border-radius: 4px; text-transform: uppercase;">
                      UPCOMING
                    </span>
                  `}
                </div>
                <span style="font-size: 8.5px; font-weight: 800; background: rgba(255,255,255,0.06); color: #9CA3AF; padding: 2px 7px; border-radius: 4px; text-transform: uppercase;">
                  ${ev.category}
                </span>
              </div>

              {/* Meet Title */}
              <div style="font-weight: 800; font-size: 15px; line-height: 1.25; margin-bottom: 6px; color: #FFFFFF; font-family: var(--font-orbitron), sans-serif; letter-spacing: -0.01em;">
                ${ev.title}
              </div>

              {/* Description box: 4 rows truncated style */}
              <div style="font-size: 11px; color: #9CA3AF; line-height: 1.4; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; height: 60px;">
                ${truncatedDesc}
              </div>

              {/* Meta details listings grid layout */}
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 8px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 4px;">
                <div style="font-size: 10px; color: #D1D5DB; display: flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  📍 <strong style="color: #6B7280; font-weight: 600;">Venue:</strong> ${ev.location}
                </div>
                <div style="font-size: 10px; color: #D1D5DB; display: flex; align-items: center; gap: 4px;">
                  📅 <strong style="color: #6B7280; font-weight: 600;">Date:</strong> ${ev.date || 'TBD'}
                </div>
                ${ev.time ? `
                  <div style="font-size: 10px; color: #D1D5DB; display: flex; align-items: center; gap: 4px;">
                    ⏰ <strong style="color: #6B7280; font-weight: 600;">Time:</strong> ${ev.time}
                  </div>
                ` : ''}
              </div>

              {/* Big Call-to-action button */}
              <a href="/events/${ev.id}" style="display: block; text-align: center; font-size: 10.5px; font-weight: 800; background: #06B6D4; color: #000000; text-transform: uppercase; padding: 8px; border-radius: 6px; text-decoration: none; letter-spacing: 0.05em; box-shadow: 0 4px 10px rgba(6, 182, 212, 0.2); transition: all 0.2s;">
                Join Meet / Details
              </a>
            </div>
          `

          const infoWindow = new window.google.maps.InfoWindow({
            content: contentString,
          })

          // Auto-show InfoWindow upon loading the map cleanly
          // Using a small timeout to let the map initialization sequence trigger correctly
          setTimeout(() => {
            infoWindow.open(map, marker)
          }, 400)

          marker.addListener('click', () => {
            infoWindow.open(map, marker)
          })
        }

        if (hasBounds) {
          map.fitBounds(bounds)
          const listener = window.google.maps.event.addListener(map, 'idle', () => {
            if (map.getZoom()! > 15) map.setZoom(14)
            window.google.maps.event.removeListener(listener)
          })
        }
        setLoaded(true)
      })
      .catch((err) => {
        console.error(err)
        setError(true)
      })

    return () => {
      active = false
    }
  }, [activePins, isClient])

  if (!isClient) {
    return <div className="h-[360px] w-full bg-[#111111] animate-pulse rounded-2xl border border-border" />
  }

  if (activePins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[#0A0A0A] rounded-2xl border border-border/40 text-center min-h-[300px]">
        <p className="text-sm font-semibold text-text-primary">No localized pins scheduled on the grid</p>
        <p className="text-xs text-text-muted mt-1">Be the first to host a car meetup or stage an event!</p>
      </div>
    )
  }

  return (
    <div ref={mapContainerRef} className="w-full rounded-2xl overflow-hidden border border-border bg-[#0A0A0A] relative">
      <div
        ref={mapElementRef}
        className="w-full h-[360px] max-h-[500px]"
      />
      {!loaded && !error && (
        <div className="absolute inset-0 bg-black/95 z-20 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full" />
          <span className="text-xs font-black text-primary uppercase tracking-widest style-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
            Retrieving Live Selangor Meetups Grid...
          </span>
        </div>
      )}
    </div>
  )
}