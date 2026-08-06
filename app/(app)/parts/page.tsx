'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Layers, ChevronRight, HelpCircle, AlertTriangle, ExternalLink } from 'lucide-react'
import { PartsSidebar } from '@/components/ui/PartsSidebar'

interface Part {
  pos: string
  description: string
  suppl: string
  qty: string
  from_date: string
  to_date: string
  part_number: string
  price_approx: string
  notes: string
}

interface Diagram {
  id: string
  name: string
  imageUrl: string | null
  parts: Part[]
}

interface Group {
  id: string
  name: string
  diagramCount: number
  diagrams: {
    id: string
    name: string
    imageUrl: string | null
  }[]
}

export default function PartsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [selectedGroupData, setSelectedGroupData] = useState<any>(null)
  
  const [selectedDiagramId, setSelectedDiagramId] = useState<string | null>(null)
  const [selectedDiagramData, setSelectedDiagramData] = useState<any>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch initial group list
  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/parts')
      const data = await res.json()
      if (data.groups) {
        setGroups(data.groups)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const selectGroup = async (groupId: string) => {
    setSelectedGroup(groupId)
    setSelectedDiagramId(null)
    setSelectedDiagramData(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/parts?group=${groupId}`)
      const data = await res.json()
      setSelectedGroupData(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const selectDiagram = async (diagramId: string) => {
    setSelectedDiagramId(diagramId)
    setLoading(true)
    try {
      const res = await fetch(`/api/parts?diagramId=${diagramId}`)
      const data = await res.json()
      setSelectedDiagramData(data.diagram)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setIsSearching(false)
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setLoading(true)
    try {
      const res = await fetch(`/api/parts?q=${encodeURIComponent(searchQuery.trim())}`)
      const data = await res.json()
      setSearchResults(data.results || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6">
      {/* Dynamic Submenu Sidebar */}
      <PartsSidebar />

      {/* Right Main Interface */}
      <main className="flex-1 min-w-0 space-y-6">
        
        {/* Title Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
          <div>
            <h1 className="text-2xl font-semibold gradient-text" style={{ fontFamily: 'var(--font-orbitron)', fontWeight: 600 }}>Spareparts Catalog Explorer</h1>
            <p className="text-text-muted text-sm mt-1">
              Complete diagnostic schematic views, positions, part numbers, and references for the 
              <span className="text-primary font-bold ml-1">2009 BMW 740Li (F02)</span>
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="relative w-full md:w-80 flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search part name or OEM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[11px] bg-black/40 border border-slate-800 rounded-xl text-white outline-none focus:border-primary/50 placeholder:text-text-disabled/40"
              />
            </div>
            {isSearching && (
              <button
                type="button"
                onClick={() => {
                  setIsSearching(false)
                  setSearchQuery('')
                  setSearchResults([])
                }}
                className="text-[10px] uppercase font-bold text-text-muted hover:text-white px-2 border border-slate-800 rounded-lg"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {loading && (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin rounded-full" />
            <span className="ml-3 text-xs font-bold text-primary uppercase tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>
              Loading Catalog...
            </span>
          </div>
        )}

        {/* Search Results Mode */}
        {isSearching && !loading && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-orbitron)' }}>
                Search Results for &quot;{searchQuery}&quot; ({searchResults.length} matches)
              </h2>
              <button
                onClick={() => {
                  setIsSearching(false)
                  setSearchQuery('')
                  setSearchResults([])
                }}
                className="text-xs font-bold text-text-muted hover:text-white uppercase tracking-wider"
              >
                Clear Search &times;
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center">
                <AlertTriangle className="mx-auto w-8 h-8 text-yellow-500/80 mb-2" />
                <p className="text-sm text-text-secondary font-medium">No system parts matched your query. Try searching by part number or category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8">
                {searchResults.map((result, idx) => (
                  <div key={idx} className="border border-slate-850 bg-black/20 rounded-2xl overflow-hidden p-6">
                    <div className="mb-4 pb-3 border-b border-slate-850 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-primary tracking-widest block mb-0.5">
                          Group {result.groupId} — {result.groupName}
                        </span>
                        <h3 className="text-sm font-black text-white">{result.diagramName}</h3>
                      </div>
                      <button
                        onClick={() => {
                          setIsSearching(false)
                          setSelectedGroup(result.groupId)
                          selectGroup(result.groupId)
                          selectDiagram(result.diagramId)
                        }}
                        className="text-xs font-bold text-primary hover:underline uppercase tracking-wider flex items-center gap-1"
                      >
                        View Full Diagram <ChevronRight size={12} />
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-text-secondary">
                        <thead className="text-[10px] text-white font-bold uppercase tracking-wider bg-slate-900/50">
                          <tr>
                            <th className="p-2.5 rounded-l-lg">Pos</th>
                            <th className="p-2.5">Description</th>
                            <th className="p-2.5">Part OEM Number</th>
                            <th className="p-2.5">Qty</th>
                            <th className="p-2.5">From</th>
                            <th className="p-2.5">To</th>
                            <th className="p-2.5 rounded-r-lg text-right">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850/50">
                          {result.parts.map((p: Part, pIdx: number) => (
                            <tr key={pIdx} className="hover:bg-slate-900/30">
                              <td className="p-2.5 font-bold text-white">{p.pos}</td>
                              <td className="p-2.5">
                                <span className="font-extrabold text-white block">{p.description}</span>
                                {p.suppl && <span className="text-[10px] text-text-muted mt-0.5 block">{p.suppl}</span>}
                              </td>
                              <td className="p-2.5">
                                <span className="font-semibold text-primary block tracking-wider font-mono">{p.part_number}</span>
                              </td>
                              <td className="p-2.5 font-semibold text-white">{p.qty}</td>
                              <td className="p-2.5 font-semibold">{p.from_date || ''}</td>
                              <td className="p-2.5 font-semibold">{p.to_date || ''}</td>
                              <td className="p-2.5 text-right italic font-medium">{p.notes || ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Normal Exploration Mode */}
        {!isSearching && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar / Left Column: Interactive Categories */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-white uppercase tracking-widest pb-3 border-b border-slate-800" style={{ fontFamily: 'var(--font-orbitron)' }}>
                System Categories
              </h2>
              <div className="max-h-[500px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => selectGroup(g.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs font-bold flex items-center justify-between ${
                      selectedGroup === g.id
                        ? 'bg-primary/10 border-primary text-white'
                        : 'bg-black/30 border-slate-850 text-text-secondary hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span className="truncate pr-2">
                      <span className="text-primary mr-1">{g.id}</span> {g.name}
                    </span>
                    <span className="text-[10px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-md text-text-muted shrink-0">
                      {g.diagramCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Area / Right Column */}
            <div className="lg:col-span-3 space-y-8">
              {!selectedGroup ? (
                <div className="border border-slate-850 rounded-2xl bg-black/20 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                  <Layers className="w-12 h-12 text-slate-700 mb-4 animate-pulse" />
                  <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'var(--font-orbitron)' }}>
                    No Category Selected
                  </h3>
                  <p className="text-sm text-text-secondary max-w-md mx-auto">
                    Select a vehicle system category from the sidebar to browse diagnostic diagrams, specifications, and layout indices.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Category Details & Select Diagram */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-primary tracking-widest block mb-1">
                      System Group {selectedGroup}
                    </span>
                    <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-orbitron)' }}>
                      {selectedGroupData?.groupName || 'Loading...'}
                    </h2>
                  </div>

                  {/* Diagrams list in this category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedGroupData?.diagrams?.map((diag: any) => (
                      <button
                        key={diag.id}
                        onClick={() => selectDiagram(diag.id)}
                        className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between ${
                          selectedDiagramId === diag.id
                            ? 'bg-primary/5 border-primary text-white shadow-[0_0_15px_rgba(6,182,212,0.05)]'
                            : 'bg-black/30 border-slate-850 text-text-secondary hover:text-white hover:border-slate-850'
                        }`}
                      >
                        <span className="text-[10.5px] uppercase font-black text-primary/80 tracking-widest mb-1 block">
                          Diagram {diag.id}
                        </span>
                        <h4 className="text-sm font-bold text-white line-clamp-1">{diag.name}</h4>
                      </button>
                    ))}
                  </div>

                  {/* Selected Diagram Interactive Part Viewer */}
                  {selectedDiagramData ? (
                    <div className="border border-slate-800 bg-slate-950/40 rounded-3xl p-6 mt-8 space-y-6">
                      <div className="pb-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-black text-primary tracking-widest block mb-1">
                            Active Blueprint view
                          </span>
                          <h3 className="text-lg font-black text-white uppercase" style={{ fontFamily: 'var(--font-orbitron)' }}>
                            {selectedDiagramData.name} ({selectedDiagramData.id})
                          </h3>
                        </div>
                        {selectedDiagramData.url && (
                          <a
                            href={selectedDiagramData.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary font-bold border border-primary/20 hover:border-primary px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-all"
                          >
                            Source Blueprint <ExternalLink size={12} />
                          </a>
                        )}
                      </div>

                      {/* Diagram Blueprint Render Area */}
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/90 flex items-center justify-center border border-slate-800/80 group">
                        {/* Decorative Grid Overlays */}
                        <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-linear-to-r from-transparent via-[#06b6d4]/20 to-transparent animate-pulse" />
                        <div className="absolute bottom-4 left-4 text-[9px] font-mono text-[#06b6d4]/40 uppercase tracking-widest hidden md:block">
                          System Layout Ref: SEC_{selectedDiagramData.id || "F02"} // CALIBRATION: OK
                        </div>
                        <div className="absolute top-4 right-4 text-[9px] font-mono text-emerald-500/50 uppercase tracking-widest flex items-center gap-1.5 hidden md:block">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                          Diagnostic Scanner Live
                        </div>

                        {selectedDiagramData.image_url ? (
                          <img
                            src={selectedDiagramData.image_url}
                            alt={selectedDiagramData.name}
                            className="max-h-[90%] max-w-[90%] object-contain filter invert opacity-90 brightness-110 contrast-125 transition-all duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-8 text-center relative z-10 space-y-3">
                            <div className="relative">
                              <Layers className="w-12 h-12 text-primary/40 group-hover:text-primary/70 transition-colors animate-pulse" />
                              <div className="absolute -inset-1 border border-primary/20 border-dashed rounded-full animate-spin [animation-duration:12s]" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-black tracking-widest text-[#06b6d4] uppercase" style={{ fontFamily: 'var(--font-orbitron)' }}>
                                Vector Layout Rendering Pending Cache
                              </p>
                              <p className="text-[10px] text-text-muted max-w-sm mx-auto leading-relaxed">
                                Blueprint requested successfully from diagnostic directory. Verify system indexing logs or contact server admin to deploy immediate manual synchronization.
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[9px] font-mono font-bold bg-[#06b6d4]/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md">
                                ERR_IMG_CACHE_REF
                              </span>
                              <span className="text-[9px] font-mono font-bold bg-slate-900 text-text-muted border border-slate-800 px-2 py-0.5 rounded-md">
                                GROUP_{selectedGroup}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Part spec components */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                          Parts list directory indices
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#111111] text-white/90 font-bold uppercase tracking-wider text-[10px] border-b border-slate-850">
                              <tr>
                                <th className="p-3">Pos</th>
                                <th className="p-3">Part Description</th>
                                <th className="p-3">OEM Number</th>
                                <th className="p-3 text-center">Qty</th>
                                <th className="p-3">Years/Fitment</th>
                                <th className="p-3 text-right">MSRP / Approx</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850/30">
                              {selectedDiagramData.parts?.map((p: Part, index: number) => (
                                <tr key={index} className="hover:bg-slate-900/40 transition-colors">
                                  <td className="p-3 font-bold text-white">{p.pos}</td>
                                  <td className="p-3">
                                    <span className="font-extrabold text-white block">{p.description}</span>
                                    {p.suppl && <span className="text-[10px] text-text-muted block mt-0.5">{p.suppl}</span>}
                                  </td>
                                  <td className="p-3 font-mono font-bold text-primary text-xs tracking-wide">
                                    {p.part_number}
                                  </td>
                                  <td className="p-3 font-semibold text-center text-white">{p.qty || '-'}</td>
                                  <td className="p-3 text-text-secondary text-[11px] font-medium">
                                    {p.from_date && p.to_date
                                      ? `${p.from_date} — ${p.to_date}`
                                      : p.from_date
                                      ? `From ${p.from_date}`
                                      : '-'}
                                  </td>
                                  <td className="p-3 text-right font-mono font-black text-white text-xs">
                                    {p.price_approx || 'Contact For Quote'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-slate-850 rounded-2xl bg-black/20 p-8 text-center flex flex-col items-center justify-center min-h-[250px]">
                      <HelpCircle className="w-8 h-8 text-slate-800 mb-3 animate-pulse" />
                      <h4 className="text-sm font-bold mb-1" style={{ fontFamily: 'var(--font-orbitron)' }}>
                        Select Blueprint Diagram
                      </h4>
                      <p className="text-xs text-text-secondary max-w-sm mx-auto">
                        Choose a detailed schematic layout from the available system diagrams to view part indices and spec sheets.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
