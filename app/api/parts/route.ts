import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim().toLowerCase() || ''
    const group = searchParams.get('group') || ''
    const diagramId = searchParams.get('diagramId') || ''

    const dataPath = path.join(process.cwd(), 'public', 'realoem-data', 'all_realoem_parts_catalog.json')
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json({ error: 'Catalog file not found' }, { status: 404 })
    }

    const rawData = fs.readFileSync(dataPath, 'utf-8')
    const catalog = JSON.parse(rawData)

    // If searching across all parts
    if (q) {
      const results: any[] = []
      
      // Iterate catalog groups
      for (const [grpId, grp] of Object.entries(catalog) as [string, any][]) {
        if (!grp.diagrams) continue
        for (const diag of grp.diagrams) {
          if (!diag.parts) continue
          const matchedParts = diag.parts.filter((p: any) => 
            p.part_number?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.notes?.toLowerCase().includes(q) ||
            p.suppl?.toLowerCase().includes(q)
          )
          
          if (matchedParts.length > 0) {
            results.push({
              groupId: grpId,
              groupName: grp.group_name,
              diagramId: diag.id,
              diagramName: diag.name,
              imageUrl: diag.image_url || null,
              parts: matchedParts
            })
          }
        }
      }

      return NextResponse.json({ results })
    }

    // Filter by specific diagram ID
    if (diagramId) {
      for (const [grpId, grp] of Object.entries(catalog) as [string, any][]) {
        if (!grp.diagrams) continue
        const diag = grp.diagrams.find((d: any) => d.id === diagramId)
        if (diag) {
          return NextResponse.json({
            groupId: grpId,
            groupName: grp.group_name,
            diagram: diag
          })
        }
      }
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 })
    }

    // Filter by specific group ID
    if (group) {
      const grp = catalog[group]
      if (grp) {
        return NextResponse.json({
          groupId: group,
          groupName: grp.group_name,
          diagrams: grp.diagrams || []
        })
      }
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Otherwise, return group index (with diagram names counts)
    const groupsList = Object.entries(catalog).map(([id, grp]: [string, any]) => ({
      id,
      name: grp.group_name,
      diagramCount: grp.diagrams?.length || 0,
      diagrams: (grp.diagrams || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        imageUrl: d.image_url || null
      }))
    }))

    return NextResponse.json({ groups: groupsList })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
