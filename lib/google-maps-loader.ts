/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!

let loaderPromise: Promise<any> | null = null
let isLoaderInitialized = false

/**
 * A central, unified Google Maps loader that prevents "NotLoadingAPIFromGoogleMapsError".
 * Under Next.js dynamic routing, components load asynchronously. Having multiple files
 * with local loader promises can result in duplicate calls to setOptions() or multiple
 * script injections. This module acts as a global singleton.
 */
export function getMapsLoader() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Cannot load Google Maps on the server'))
  }

  // If google maps is already fully loaded in the window, use that immediately
  if ((window as any).google?.maps && (window as any).google?.maps?.Map) {
    return Promise.resolve((window as any).google.maps)
  }

  if (loaderPromise) return loaderPromise

  loaderPromise = (async () => {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key is missing')
    }

    // Safety check again right before importing to avoid racing
    if ((window as any).google?.maps && (window as any).google?.maps?.Map) {
      return (window as any).google.maps
    }

    const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader')

    if (!isLoaderInitialized) {
      try {
        setOptions({
          key: GOOGLE_MAPS_API_KEY,
          v: 'weekly',
        })
        isLoaderInitialized = true
      } catch (err) {
        console.warn('Google Maps setOptions already configured or threw:', err)
      }
    }

    // Pre-load essential libraries so that window.google.maps matches what components expect
    await Promise.all([
      importLibrary('maps'),
      importLibrary('marker')
    ])

    return (window as any).google.maps
  })()

  return loaderPromise
}
