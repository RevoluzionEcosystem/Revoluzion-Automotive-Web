import React from 'react'

export const metadata = {
  title: 'Thread Sizes & Fittings — Identification Guide',
  description: 'Comprehensive reference for NPT, BSP, AN, metric, ORB, flare and common fitting thread standards.',
}

export default function ThreadSizesGuide() {
  return (
    <div className="prose max-w-none px-6 py-10">
      <h1>Thread Sizes & Fittings — Identification Guide</h1>

      <p>This guide covers common mechanical and hydraulic thread standards and fittings used in automotive and industrial applications. It explains identification, dimensional notes, sealing method, common uses, and tips for assembly.</p>

      <h2>NPT (National Pipe Taper)</h2>
      <p>NPT is a U.S. tapered pipe thread standard (ANSI/ASME B1.20.1). NPT threads seal by interference and thread deformation — use thread sealant or tape for gas-tight joints.</p>
      <ul>
        <li><strong>Identification:</strong> Tapered threads, measured by nominal pipe size (e.g., 1/8", 1/4", 1/2").</li>
        <li><strong>Sealing:</strong> Thread sealant or PTFE tape.</li>
        <li><strong>Common uses:</strong> Plumbing, air and fuel lines, adapters.</li>
      </ul>

      <h2>BSP (British Standard Pipe) — BSPT / BSPP</h2>
      <p>BSP comes in tapered (BSPT) and parallel (BSPP) forms. BSPT seals similarly to NPT (tapered), while BSPP often relies on an O-ring or washer for sealing when used with a mating port.</p>

      <h2>AN / JIC / Flare (37° and 45°)</h2>
      <p>AN (Army-Navy) fittings use a 37° flare seat (often called JIC in hydraulic contexts). Metric flare and SAE flares may use a 45° seat (common on brake lines and automotive tubing).</p>
      <ul>
        <li><strong>Identification:</strong> Flared tube end with matching flare nut and male fitting.</li>
        <li><strong>Sealing:</strong> Metal-to-metal flare face (37° or 45°) — avoid over-tightening; use proper flare tools.</li>
        <li><strong>Common uses:</strong> High-pressure hydraulics, fuel lines (AN), brake lines (45° SAE).</li>
      </ul>

      <h2>ORB (O-Ring Boss)</h2>
      <p>ORB fittings use a straight thread with a recessed port containing an O-ring for sealing. Threads themselves do not seal — the O-ring does.</p>
      <ul>
        <li><strong>Identification:</strong> Parallel threads with a hex shoulder and a visible O-ring in the female port.</li>
        <li><strong>Sealing:</strong> Elastomeric O-ring; ensure O-ring material compatibility.</li>
        <li><strong>Common uses:</strong> Hydraulic ports on pumps, valves, and manifolds.</li>
      </ul>

      <h2>Metric Threads (ISO)</h2>
      <p>Metric threads follow the ISO metric standard (M# × pitch). Use appropriate thread gauges or measure major diameter and pitch to identify.</p>

      <h2>Compression Fittings</h2>
      <p>Compression fittings use a ferrule (or two) to compress against tubing. Common in instrumentation and low-pressure hydraulic lines.</p>

      <h2>Identification Cheat Sheet</h2>
      <ol>
        <li>Measure outer diameter (major) and pitch (threads per inch or mm pitch).</li>
        <li>Check thread form: tapered vs parallel.</li>
        <li>Inspect sealing method: thread deformation, O-ring, flare face, or ferrule.</li>
        <li>Match with common standards: NPT, BSPT, BSPP, AN/JIC, ORB, Metric.</li>
      </ol>

      <h2>Assembly Best Practices</h2>
      <ul>
        <li>Clean threads and mating surfaces.</li>
        <li>Use proper sealants where required (PTFE tape for NPT, thread paste for high-pressure gas).</li>
        <li>Do not reuse damaged ferrules or flares; replace if deformed.</li>
        <li>Torque to manufacturer specs — avoid over-tightening.</li>
      </ul>

      <h2>Reference Tables</h2>
      <p>For precise dimensions refer to the relevant standards (ASME, ISO, SAE). Below are quick references to common sizes (nominal):</p>

      <h3>NPT nominal sizes (examples)</h3>
      <ul>
        <li>1/8" NPT — approx major OD 0.405"</li>
        <li>1/4" NPT — approx major OD 0.540"</li>
        <li>3/8" NPT — approx major OD 0.675"</li>
        <li>1/2" NPT — approx major OD 0.840"</li>
      </ul>

      <h3>AN sizing</h3>
      <p>AN sizes are given as -2, -3, -4 etc. where the number corresponds to 1/16ths of an inch of O.D. tubing (e.g., AN-4 = 4/16 = 1/4" tube).</p>

      <h2>Further Reading</h2>
      <ul>
        <li><a href="https://en.wikipedia.org/wiki/National_pipe_thread">NPT (Wikipedia)</a></li>
        <li><a href="https://en.wikipedia.org/wiki/British_Standard_Pipe">BSP (Wikipedia)</a></li>
        <li><a href="https://en.wikipedia.org/wiki/AN_thread">AN fittings</a></li>
      </ul>

    </div>
  )
}
