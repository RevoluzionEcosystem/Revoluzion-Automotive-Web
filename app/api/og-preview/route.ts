import { NextRequest, NextResponse } from 'next/server'

function isPrivateHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    hostname === '::1' ||
    hostname.endsWith('.local') ||
    hostname === '0.0.0.0'
  )
}

function getMeta(html: string, names: string[]): string | null {
  for (const name of names) {
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"'<>]+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"'<>]+)["'][^>]*(?:property|name)=["']${name}["']`, 'i'),
    ]
    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match?.[1]) return match[1].trim()
    }
  }
  return null
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url')
  if (!rawUrl) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 })
  }

  if (isPrivateHost(parsed.hostname)) {
    return NextResponse.json({ error: 'Private URL not allowed' }, { status: 400 })
  }

  try {
    const res = await fetch(rawUrl, {
      signal: AbortSignal.timeout(6000),
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })

    if (!res.ok) return NextResponse.json({ error: `HTTP ${res.status}` }, { status: 400 })

    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) {
      return NextResponse.json({ error: 'Not an HTML page' }, { status: 400 })
    }

    // Read at most 100 KB to avoid memory issues
    const reader = res.body?.getReader()
    if (!reader) return NextResponse.json({ error: 'No body' }, { status: 400 })

    let html = ''
    let bytesRead = 0
    const maxBytes = 100_000
    const decoder = new TextDecoder()

    while (bytesRead < maxBytes) {
      const { done, value } = await reader.read()
      if (done) break
      html += decoder.decode(value, { stream: true })
      bytesRead += value.byteLength
    }
    reader.cancel()

    const title =
      getMeta(html, ['og:title', 'twitter:title']) ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
      null

    const description = getMeta(html, ['og:description', 'twitter:description', 'description']) || null

    let image = getMeta(html, ['og:image', 'twitter:image:src', 'twitter:image']) || null
    if (image && !image.startsWith('http')) {
      try {
        image = new URL(image, rawUrl).toString()
      } catch {
        image = null
      }
    }

    const siteName = getMeta(html, ['og:site_name']) || parsed.hostname

    return NextResponse.json(
      { title, description, image, url: rawUrl, siteName },
      { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } },
    )
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 400 })
  }
}
