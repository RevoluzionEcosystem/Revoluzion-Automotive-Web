'use client'

import React from 'react'

export function ThreadSizesAndFittingsContent() {
  return (
    <div className="prose prose-invert max-w-none space-y-6 text-text-secondary text-sm leading-relaxed">
      <div className="border-b border-border/40 pb-4 mb-4">
        <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>
          Thread Sizes & Fittings — Identification Guide
        </h1>
        <p className="text-text-muted text-xs mt-1">
          Comprehensive reference for NPT, BSP, AN, metric, ORB, flare and common fitting thread standards.
        </p>
      </div>

      <p>This guide covers common mechanical and hydraulic thread standards and fittings used in automotive and industrial applications. It explains identification, dimensional notes, sealing method, common uses, and tips for assembly.</p>

      <section className="card p-5 space-y-2">
        <h2 className="text-white font-bold text-base border-b border-border/20 pb-2">NPT (National Pipe Taper)</h2>
        <p>NPT is a U.S. tapered pipe thread standard (ANSI/ASME B1.20.1). NPT threads seal by interference and thread deformation — use thread sealant or tape for gas-tight joints.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Identification:</strong> Tapered threads, measured by nominal pipe size (e.g., 1/8&quot;, 1/4&quot;, 1/2&quot;).</li>
          <li><strong>Sealing:</strong> Thread sealant or PTFE tape.</li>
          <li><strong>Common uses:</strong> Plumbing, air and fuel lines, adapters.</li>
        </ul>
      </section>

      <section className="card p-5 space-y-2">
        <h2 className="text-white font-bold text-base border-b border-border/20 pb-2">BSP (British Standard Pipe) — BSPT / BSPP</h2>
        <p>BSP comes in tapered (BSPT) and parallel (BSPP) forms. BSPT seals similarly to NPT (tapered), while BSPP often relies on an O-ring or washer for sealing when used with a mating port.</p>
      </section>

      <section className="card p-5 space-y-2">
        <h2 className="text-white font-bold text-base border-b border-border/20 pb-2">AN / JIC / Flare (37° and 45°)</h2>
        <p>AN (Army-Navy) fittings use a 37° flare seat (often called JIC in hydraulic contexts). Metric flare and SAE flares may use a 45° seat (common on brake lines and automotive tubing).</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Identification:</strong> Flared tube end with matching flare nut and male fitting.</li>
          <li><strong>Sealing:</strong> Metal-to-metal flare face (37° or 45°) — avoid over-tightening; use proper flare tools.</li>
          <li><strong>Common uses:</strong> High-pressure hydraulics, fuel lines (AN), brake lines (45° SAE).</li>
        </ul>
      </section>

      <section className="card p-5 space-y-2">
        <h2 className="text-white font-bold text-base border-b border-border/20 pb-2">ORB (O-Ring Boss)</h2>
        <p>ORB fittings use a straight thread with a recessed port containing an O-ring for sealing. Threads themselves do not seal — the O-ring does.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Identification:</strong> Parallel threads with a hex shoulder and a visible O-ring in the female port.</li>
          <li><strong>Sealing:</strong> Elastomeric O-ring; ensure O-ring material compatibility.</li>
          <li><strong>Common uses:</strong> Hydraulic ports on pumps, valves, and manifolds.</li>
        </ul>
      </section>

      <section className="card p-5 space-y-2">
        <h2 className="text-white font-bold text-base border-b border-border/20 pb-2">Metric Threads (ISO)</h2>
        <p>Metric threads follow the ISO metric standard (M# × pitch). Use appropriate thread gauges or measure major diameter and pitch to identify.</p>
      </section>

      <section className="card p-5 space-y-2">
        <h2 className="text-white font-bold text-base border-b border-border/40 pb-2">Assembly Best Practices</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Clean threads and mating surfaces.</li>
          <li>Use proper sealants where required (PTFE tape for NPT, thread paste for high-pressure gas).</li>
          <li>Do not reuse damaged ferrules or flares; replace if deformed.</li>
          <li>Torque to manufacturer specs — avoid over-tightening.</li>
        </ul>
      </section>

      <section className="card p-5 space-y-2">
        <h2 className="text-white font-bold text-base border-b border-border/40 pb-2">Quick AN Size Reference Table</h2>
        <table className="w-full text-left text-xs mt-2 border-collapse border border-border">
          <thead>
            <tr className="bg-white/5 border-b border-border">
              <th className="p-2 font-bold text-white border-r border-border">AN Size</th>
              <th className="p-2 font-bold text-white border-r border-border">Tubing OD (Inches)</th>
              <th className="p-2 font-bold text-white">Thread Sizing (UNF)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="p-2 font-semibold text-primary border-r border-border">AN-3</td>
              <td className="p-2 border-r border-border">3/16&quot;</td>
              <td className="p-2">3/8&quot;-24</td>
            </tr>
            <tr className="border-b border-border bg-white/5">
              <td className="p-2 font-semibold text-primary border-r border-border">AN-4</td>
              <td className="p-2 border-r border-border">1/4&quot;</td>
              <td className="p-2">7/16&quot;-20</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-2 font-semibold text-primary border-r border-border">AN-6</td>
              <td className="p-2 border-r border-border">3/8&quot;</td>
              <td className="p-2">9/16&quot;-18</td>
            </tr>
            <tr className="border-b border-border bg-white/5">
              <td className="p-2 font-semibold text-primary border-r border-border">AN-8</td>
              <td className="p-2 border-r border-border">1/2&quot;</td>
              <td className="p-2">3/4&quot;-16</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-2 font-semibold text-primary border-r border-border">AN-10</td>
              <td className="p-2 border-r border-border">5/8&quot;</td>
              <td className="p-2">7/8&quot;-14</td>
            </tr>
            <tr className="border-b border-border bg-white/5">
              <td className="p-2 font-semibold text-primary border-r border-border">AN-12</td>
              <td className="p-2 border-r border-border">3/4&quot;</td>
              <td className="p-2">1-1/16&quot;-12</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  )
}
