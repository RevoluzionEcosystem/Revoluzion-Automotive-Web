'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Sparkles, X, CornerDownRight } from 'lucide-react'

interface Props {
  allListingsTitles: string[]
}

/**
 * Computes Levenshtein Distance between two strings.
 * Used to handle typo correction, spelling tolerances, and phonetic approximations.
 */
function getLevenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = []
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i]
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1, // deletion
        tmp[i][j - 1] + 1, // insertion
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1) // substitution
      )
    }
  }
  return tmp[a.length][b.length]
}

/**
 * Advanced search helper matching typos, loose words, trigrams, and spelling variations.
 */
function getSmartSearchSuggestion(query: string, titles: string[]): string | null {
  const cleanQuery = query.trim().toLowerCase()
  if (cleanQuery.length < 2) return null

  // 1. Exact or include check
  const exactMatch = titles.find(t => t.toLowerCase() === cleanQuery)
  if (exactMatch) return null // Already perfectly matching

  const queryWords = cleanQuery.split(/\s+/).filter(Boolean)
  if (queryWords.length === 0) return null

  let bestMatch: string | null = null
  let lowestDistance = 999
  let highestWordOverlaps = 0

  for (const title of titles) {
    const cleanTitle = title.toLowerCase()
    const titleWords = cleanTitle.split(/\s+/).filter(Boolean)

    // Count loosely matching words
    let overlaps = 0
    queryWords.forEach(qw => {
      // Direct substring match
      if (cleanTitle.includes(qw)) {
        overlaps += 3
        return
      }
      // Check partial typo matches among title words
      titleWords.forEach(tw => {
        if (tw === qw) {
          overlaps += 4
        } else if (tw.includes(qw) || qw.includes(tw)) {
          overlaps += 2
        } else {
          const dist = getLevenshteinDistance(qw, tw)
          // Tolerates up to 2 character typos depending on length
          if (dist <= 2 && qw.length > 3) {
            overlaps += 2
          }
        }
      })
    })

    // If query matches a big word overlap, track it
    if (overlaps > highestWordOverlaps) {
      highestWordOverlaps = overlaps
      bestMatch = title
      lowestDistance = getLevenshteinDistance(cleanQuery, cleanTitle)
    } else if (overlaps === highestWordOverlaps && overlaps > 0) {
      const dist = getLevenshteinDistance(cleanQuery, cleanTitle)
      if (dist < lowestDistance) {
        lowestDistance = dist
        bestMatch = title
      }
    }
  }

  // Only suggest if it is a different title word match we actually found
  if (bestMatch && bestMatch.toLowerCase() !== cleanQuery && highestWordOverlaps > 0) {
    return bestMatch
  }

  return null
}

export function PremiumLooseSearch({ allListingsTitles }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialQuery = searchParams.get('q') || ''
  const [inputVal, setInputVal] = useState(initialQuery)
  const [suggestion, setSuggestion] = useState<string | null>(null)

  // Sync with search params changes
  useEffect(() => {
    setInputVal(initialQuery)
  }, [initialQuery])

  // Real-time lookup for typo corrections and approximations
  useEffect(() => {
    if (inputVal.trim().length >= 2) {
      const suggested = getSmartSearchSuggestion(inputVal, allListingsTitles)
      setSuggestion(suggested)
    } else {
      setSuggestion(null)
    }
  }, [inputVal, allListingsTitles])

  const triggerSearch = (queryText: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (queryText.trim()) {
      params.set('q', queryText.trim())
    } else {
      params.delete('q')
    }
    router.push(`/marketplace?${params.toString()}`)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    triggerSearch(inputVal)
    setSuggestion(null)
  }

  const handleAcceptSuggestion = () => {
    if (suggestion) {
      setInputVal(suggestion)
      triggerSearch(suggestion)
      setSuggestion(null)
    }
  }

  const handleClear = () => {
    setInputVal('')
    triggerSearch('')
    setSuggestion(null)
  }

  return (
    <div className="w-full space-y-2 mb-6">
      <form onSubmit={handleFormSubmit} className="flex gap-2 relative group w-full">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search parts, engines, brands, tyres (Typo-safe)..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="w-full h-11 pl-11 pr-10 rounded-2xl bg-surface/50 border border-primary/40 focus:border-primary text-sm text-white placeholder-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary/25 transition-all shadow-lg"
            style={{ fontFamily: 'var(--font-inter), sans-serif' }}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary group-focus-within:text-primary transition-colors" />
          
          {inputVal && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Small backup Search Button */}
        <button
          type="submit"
          className="h-11 px-6 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/60 text-primary text-xs font-semibold tracking-wide transition-all shadow-md flex items-center gap-1.5 shrink-0"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          <Search className="h-3 w-3" />
          <span>Search</span>
        </button>
      </form>

      {/* Suggested Typo correction element */}
      {suggestion && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 border border-primary/25 rounded-xl text-[11px] text-text-secondary animate-fade-in w-fit">
          <Sparkles className="h-3 w-3 text-primary animate-pulse" />
          <span>Did you mean:</span>
          <button
            type="button"
            onClick={handleAcceptSuggestion}
            className="font-black text-primary hover:text-primary-light underline transition-colors cursor-pointer text-left truncate max-w-[280px]"
          >
            {suggestion}
          </button>
        </div>
      )}
    </div>
  )
}
