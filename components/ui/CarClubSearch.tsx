'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, Sparkles } from 'lucide-react'

interface Props {
  allClubNames: string[]
}

export function CarClubSearch({ allClubNames }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [val, setVal] = useState(searchParams.get('q') || '')
  const [showSuggests, setShowSuggests] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setVal(searchParams.get('q') || '')
  }, [searchParams])

  const suggests = React.useMemo(() => {
    if (!val.trim()) {
      return []
    }
    const cleanedVal = val.toLowerCase().trim()
    return allClubNames
      .filter(t => t.toLowerCase().includes(cleanedVal))
      .slice(0, 5)
  }, [val, allClubNames])

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
    router.push(`/car-clubs?${params.toString()}`)
  }

  function handleClear() {
    setVal('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    router.push(`/car-clubs?${params.toString()}`)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl text-xs z-20">
      <div className="relative flex items-center h-11 bg-surface border border-slate-700/80 rounded-2xl px-3.5 focus-within:border-primary/60 shadow-lg transition-colors group">
        <Search size={16} className="text-text-disabled group-focus-within:text-primary transition-colors shrink-0" />
        
        <input
          value={val}
          onChange={(e) => {
            setVal(e.target.value)
            setShowSuggests(true)
          }}
          onFocus={() => setShowSuggests(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              triggerSearch(val)
            }
          }}
          placeholder="Search stance, drift, JDM, classic restoration or local car clubs..."
          className="flex-1 h-full bg-transparent border-0 outline-none text-white text-xs px-3.5 placeholder:text-text-muted/60"
        />

        {val && (
          <button 
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-slate-800 text-text-muted hover:text-white rounded-lg transition-colors mr-1 cursor-pointer"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {showSuggests && suggests.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 overflow-hidden z-30 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black text-primary/80 uppercase tracking-widest border-b border-white/5 select-none mb-1">
            <Sparkles size={11} /> Suggested Communities
          </div>
          {suggests.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setVal(item)
                triggerSearch(item)
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs text-text-muted hover:text-white hover:bg-slate-900 transition-colors uppercase font-medium truncate flex items-center gap-2 cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}