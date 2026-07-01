'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  eventId: string
}

export function EventViewIncrement({ eventId }: Props) {
  const supabase = createClient()
  const incremented = useRef(false)

  useEffect(() => {
    if (incremented.current) return
    incremented.current = true

    // Fire-and-forget background view registration on page mount
    // Using standard async wrapper to satisfy both JS Promises and TS compilation rules
    const doIncrement = async () => {
      try {
        await supabase.rpc('increment_event_views', { event_id: eventId })
      } catch (err) {
        console.error('Failed to register view analytics:', err)
      }
    }
    
    doIncrement()
  }, [eventId, supabase])

  return null
}

