'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, Sparkles } from 'lucide-react'

interface Props {
  allTitles: string[]
}

export function VehicleAdSearch({ allTitles }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [val, setVal] = useState(searchParams.get('q') || '')
  const [showSuggests, setShowSuggests] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setVal(searchParams.get('q') || '')
  }, [searchParams])

  const suggests = useMemo(() => {
    if (!val.trim()) {
      return []
    }
    const cleanedVal = val.toLowerCase().trim()
    return allTitles
      .filter(t => t.toLowerCase().includes(cleanedVal))
      .slice(0, 5)
  }, [val, allTitles])

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggests(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  function triggerSearch(term: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (term.trim()) {
      params.set('q', term.trim())
    } else {
      params.delete('q')
    }
    setShowSuggests(false)
    router.push(`/vehicles?${params.toString()}`)
  }

  function handleClear() {
    setVal('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    router.push(`/vehicles?${params.toString()}`)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl text-xs z-20">
      <div className="relative flex items-center h-11 bg-surface border border-slate-700/80 rounded-2xl px-3.5 focus-within:border-primary/60 shadow-lg transition-colors group">
        <Search size={16} className="text-text-disabled group-focus-within:text-primary transition-colors shrink-0" />
        <input
          type="text"
          value={val}
          onChange={(e) => {
            setVal(e.target.value)
            setShowSuggests(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') triggerSearch(val)
          }}
          onFocus={() => setShowSuggests(true)}
          placeholder="Search items..."
          className="w-full h-full bg-transparent px-3 text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        {val && (
          <button onClick={handleClear} className="p-1 hover:bg-surface-variant rounded-full text-text-muted hover:text-text-primary transition-colors shrink-0">
            <X size={14} />
          </button>
        )}
      </div>

      {showSuggests && suggests.length > 0 && (
        <div className="absolute top-12 left-0 right-0 bg-surface border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl z-50">
          <div className="text-[10px] text-primary/70 font-bold uppercase tracking-wider p-2 flex items-center gap-1">
            <Sparkles size={11} /> Suggestions
          </div>
          <div className="space-y-0.5">
            {suggests.map((s, index) => (
              <button
                key={index}
                onClick={() => triggerSearch(s)}
                className="w-full text-left px-3 py-2 hover:bg-surface-variant rounded-xl text-text-primary hover:text-primary transition-colors font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
